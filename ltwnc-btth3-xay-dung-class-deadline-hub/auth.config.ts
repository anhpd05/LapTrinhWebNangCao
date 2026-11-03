import type { NextAuthConfig } from 'next-auth';

// Cấu hình an toàn cho Edge runtime: KHÔNG import fs, bcryptjs hay lib/data ở đây.
// middleware.ts chỉ import file này; provider Credentials (cần bcrypt + fs) nằm ở auth.ts.
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  // Auth.js v5 chỉ tự tin host khi chạy trên Vercel; sau reverse proxy (Hostinger) thiếu
  // trustHost thì bản production báo UntrustedHost. Đặt cả env AUTH_TRUST_HOST=true cho chắc.
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.initials = user.initials;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.initials = token.initials;
      return session;
    },
  },
} satisfies NextAuthConfig;
