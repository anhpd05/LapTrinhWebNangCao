import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { can, roleOf } from './lib/permissions';

// Middleware chỉ dùng cấu hình Edge-safe (không có provider, không fs/bcrypt).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const role = roleOf(req.auth);
  const { pathname, search } = req.nextUrl;

  if (role === 'guest') {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && !can(role, 'deadline:create')) {
    return NextResponse.redirect(new URL('/403', req.nextUrl));
  }
});

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
