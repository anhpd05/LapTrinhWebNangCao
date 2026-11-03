'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Cùng phong cách trang 404/lỗi toàn cục, nhưng nằm gọn trong khung app (vẫn giữ sidebar).
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      role="alert"
      className="relative flex min-h-[420px] flex-col justify-center gap-4 overflow-hidden rounded-[22px] bg-ink p-8 text-[#f4f5f7]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2.5 top-2 select-none font-display text-[clamp(100px,20vw,220px)] font-extrabold leading-none tracking-[-0.07em] text-transparent [-webkit-text-stroke:2px_#D4FF3A]"
      >
        LỖI
      </span>
      <span className="relative self-start rounded-pill bg-[#2a2210] px-3 py-1.5 font-mono text-[13px] font-bold tracking-[0.08em] text-[#ffc266]">
        LỖI
      </span>
      <h2 className="relative max-w-[520px] font-display text-[clamp(32px,6vw,48px)] font-extrabold leading-[0.98] tracking-[-0.035em]">
        Không tải được việc của bạn.
      </h2>
      <p className="relative max-w-[440px] leading-relaxed text-[#c3c9d4]">
        Đã có sự cố ở phía máy chủ. Bạn thử tải lại, nếu vẫn lỗi hãy quay về trang chủ.
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs text-muted-dark">Mã lỗi: {error.digest}</span>
        ) : null}
      </p>
      <div className="relative flex flex-wrap gap-3 pt-1.5">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[52px] cursor-pointer rounded-card bg-lime px-[22px] font-extrabold text-ink"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="flex min-h-[52px] items-center rounded-card border border-[#2a303c] px-5 font-semibold text-[#f4f5f7] hover:text-[#f4f5f7]"
        >
          Trang chủ
        </Link>
      </div>
    </section>
  );
}
