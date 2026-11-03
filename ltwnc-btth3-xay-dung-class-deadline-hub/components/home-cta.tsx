'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Client nhỏ: trang chủ là SSG nên không đọc session ở server. Mặc định (và lúc session
// đang tải) hiện nút "Đăng nhập →" khớp HTML tĩnh; đăng nhập rồi thì đổi sang "Mở Việc của tôi →".
export function HomeCta() {
  const { status } = useSession();
  const loggedIn = status === 'authenticated';

  return (
    <Link
      href={loggedIn ? '/dashboard' : '/login'}
      className="inline-flex min-h-[52px] items-center rounded-field bg-ink px-6 text-base font-bold text-white hover:text-white"
    >
      {loggedIn ? 'Mở Việc của tôi →' : 'Đăng nhập →'}
    </Link>
  );
}
