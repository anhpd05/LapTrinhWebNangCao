'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import type { Role } from '@/lib/types';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Lớp trưởng · admin',
  user: 'Sinh viên · user',
};

// Dùng useSession() ở client (không gọi auth() ở server) để layout public
// không đọc cookie và các trang SSG/ISR không bị chuyển thành dynamic.
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    // Khung giữ chỗ cùng kích thước nút "Đăng nhập" để không giật layout.
    return <div aria-hidden="true" className="h-11 w-[118px] animate-pulse rounded-[10px] bg-line-dark" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex min-h-11 items-center rounded-[10px] bg-lime px-[18px] text-[15px] font-bold text-ink hover:text-ink"
      >
        Đăng nhập
      </Link>
    );
  }

  const { name, role, initials } = session.user;
  return (
    <div className="flex items-center gap-3">
      <Avatar initials={initials} role={role} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{name}</span>
        <span className={`text-xs font-semibold ${role === 'admin' ? 'text-[#ffc266]' : 'text-muted-dark'}`}>
          {ROLE_LABEL[role]}
        </span>
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="min-h-11 cursor-pointer rounded-[10px] border border-[#2a303c] px-3.5 text-sm font-semibold text-[#f4f5f7]"
      >
        Đăng xuất
      </button>
    </div>
  );
}
