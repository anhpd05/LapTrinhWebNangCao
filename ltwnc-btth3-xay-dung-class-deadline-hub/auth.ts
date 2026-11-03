import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { getUserByEmail } from './lib/data';
import { githubIdentity } from './lib/github-identity';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const GITHUB_API = 'https://api.github.com';

const githubEmailsSchema = z.array(
  z.object({ email: z.string(), primary: z.boolean(), verified: z.boolean() }),
);

function githubHeaders(accessToken: string | undefined) {
  return { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'class-deadline-hub' };
}

// Email GitHub quyết định quyền (trùng users.json thì nhận luôn role của tài khoản đó), nên chỉ
// tin email primary ĐÃ XÁC MINH lấy từ /user/emails. Không có thì coi như tài khoản không có email.
async function verifiedPrimaryEmail(accessToken: string | undefined): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/user/emails`, { headers: githubHeaders(accessToken) });
  if (!res.ok) return null;
  const parsed = githubEmailsSchema.safeParse(await res.json());
  if (!parsed.success) return null;
  return parsed.data.find((e) => e.primary && e.verified)?.email ?? null;
}

// Sau reverse proxy của Hostinger, Next nhận host là `0.0.0.0:3000`, nên Auth.js dựng sai mọi URL tuyệt đối
// (Đăng xuất chuyển tới https://0.0.0.0:3000/, callback GitHub sai). `AUTH_URL` buộc Auth.js dùng đúng
// địa chỉ gốc; next-auth đọc nó ở mỗi request. Lấy theo SITE_URL để khỏi khai báo trùng hai biến.
if (!process.env.AUTH_URL && process.env.SITE_URL) process.env.AUTH_URL = process.env.SITE_URL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await getUserByEmail(parsed.data.email);
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials,
          studentId: user.studentId,
        };
      },
    }),
    GitHub({
      userinfo: {
        url: `${GITHUB_API}/user`,
        async request({ tokens }: { tokens: { access_token?: string } }) {
          const res = await fetch(`${GITHUB_API}/user`, { headers: githubHeaders(tokens.access_token) });
          if (!res.ok) throw new Error(`GitHub /user trả về ${res.status}`);
          const profile = await res.json();
          return { ...profile, email: await verifiedPrimaryEmail(tokens.access_token) };
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Auth.js gán id ngẫu nhiên (randomUUID) cho user OAuth ở MỖI lần đăng nhập, nên không dùng
    // user.id của GitHub. `account` chỉ có ở lần đăng nhập: ghép theo email với users.json
    // (dùng chung id -> chung tiến độ), không trùng thì là sinh viên với id cố định gh-<githubId>.
    // Callback này chỉ chạy ở Node (route handler); middleware dùng jwt của auth.config.ts.
    async jwt(params) {
      const { token, account } = params;
      if (account?.provider !== 'github') return authConfig.callbacks.jwt(params);

      const linked = token.email ? await getUserByEmail(token.email) : undefined;
      const identity = githubIdentity(linked, {
        providerAccountId: account.providerAccountId,
        name: token.name,
      });
      token.id = identity.id;
      if (identity.name) token.name = identity.name;
      token.role = identity.role;
      token.initials = identity.initials;
      token.studentId = identity.studentId;
      return token;
    },
  },
});
