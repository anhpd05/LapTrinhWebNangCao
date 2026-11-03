'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Hai client nhỏ (phụ đề + nút): trang chủ là SSG nên không đọc session ở server. Mặc định (và lúc session
// đang tải) hiện nút "Đăng nhập →" khớp HTML tĩnh; đăng nhập rồi thì đổi sang "Mở Việc của tôi →".
export function HomeCtaText() {
  const { status } = useSession();

  return (
    <p className="text-base text-[#2B3110]">
      {status === 'authenticated'
        ? 'Bạn đã đăng nhập. Mở bảng việc để tick bài đã xong.'
        : 'Đăng nhập để có bảng việc riêng và theo dõi tiến độ học kỳ.'}
    </p>
  );
}

export function HomeCta() {
  const { status } = useSession();
  const loggedIn = status === 'authenticated';

  return (
    <Link
      href={loggedIn ? '/dashboard' : '/login'}
      className="relative inline-flex min-h-[52px] items-center gap-2 rounded-field bg-ink px-6 text-base font-bold text-white hover:bg-ink-2 hover:text-white"
    >
      {loggedIn ? 'Mở Việc của tôi' : 'Đăng nhập'}
      <span aria-hidden="true" className="arrow-nudge">→</span>
    </Link>
  );
}
