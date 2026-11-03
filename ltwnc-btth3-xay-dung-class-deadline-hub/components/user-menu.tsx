'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import type { Role } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Lớp trưởng',
  user: 'Sinh viên',
};

// Dùng useSession() ở client (không gọi auth() ở server) để layout public
// không đọc cookie và các trang SSG/ISR không bị chuyển thành dynamic.
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div aria-hidden className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />;
  }

  if (!session) {
    return (
      <Link href="/login" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
        Đăng nhập
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>
        <span className="font-semibold">{session.user.name}</span>{' '}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {ROLE_LABEL[session.user.role]}
        </span>
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold"
      >
        Đăng xuất
      </button>
    </div>
  );
}
