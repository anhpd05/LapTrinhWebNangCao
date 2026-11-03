'use client';

import { signOut } from 'next-auth/react';

export function SwitchAccountButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="min-h-[52px] cursor-pointer rounded-card border border-[#2a303c] px-5 font-semibold text-[#f4f5f7]"
    >
      Đăng nhập tài khoản khác
    </button>
  );
}
