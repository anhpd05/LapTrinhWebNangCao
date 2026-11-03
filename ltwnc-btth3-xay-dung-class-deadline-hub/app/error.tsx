'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { DarkBand } from '@/components/layout/dark-band';
import { PublicHeader } from '@/components/layout/public-header';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DarkBand>
      <PublicHeader />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[-20px] top-10 select-none font-display text-[clamp(120px,26vw,260px)] font-extrabold leading-none tracking-[-0.07em] text-transparent [-webkit-text-stroke:2px_#D4FF3A]"
      >
        LỖI
      </span>
      <main id="main" className="relative mx-auto flex min-h-[70vh] max-w-[1280px] flex-col gap-4 px-6 pb-[72px] pt-[120px]">
        <span className="self-start rounded-pill bg-[#2a2210] px-3 py-1.5 font-mono text-[13px] font-bold tracking-[0.08em] text-[#ffc266]">
          LỖI
        </span>
        <h1 className="max-w-[620px] font-display text-[clamp(40px,8vw,60px)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          Có lỗi khi tải trang.
        </h1>
        <p className="max-w-[480px] text-base leading-relaxed text-[#c3c9d4]">
          Đã có sự cố ở phía máy chủ. Bạn thử tải lại, nếu vẫn lỗi hãy quay về trang chủ.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs text-muted-dark">Mã lỗi: {error.digest}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-3 pt-1.5">
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
      </main>
    </DarkBand>
  );
}
