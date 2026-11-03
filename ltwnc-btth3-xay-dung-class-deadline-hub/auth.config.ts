import type { NextAuthConfig } from 'next-auth';

// Cấu hình an toàn cho Edge runtime: KHÔNG import fs, bcryptjs hay lib/data ở đây.
// middleware.ts chỉ import file này; provider Credentials (cần bcrypt + fs) nằm ở auth.ts.
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
