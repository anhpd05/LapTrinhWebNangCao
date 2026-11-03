'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="min-h-11 cursor-pointer rounded-[10px] border border-[#2a303c] bg-transparent text-sm font-semibold text-[#f4f5f7]"
    >
      Đăng xuất
    </button>
  );
}
