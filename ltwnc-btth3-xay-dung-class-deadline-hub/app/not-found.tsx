import type { Metadata } from 'next';
import Link from 'next/link';
import { CurrentPath } from '@/components/layout/current-path';
import { DarkBand } from '@/components/layout/dark-band';
import { PublicHeader } from '@/components/layout/public-header';

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <DarkBand>
      <PublicHeader />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[-20px] top-10 select-none font-display text-[clamp(160px,34vw,340px)] font-extrabold leading-none tracking-[-0.07em] text-transparent [-webkit-text-stroke:2px_#D4FF3A]"
      >
        404
      </span>
      <main id="main" className="relative mx-auto flex min-h-[70vh] max-w-[1280px] flex-col gap-4 px-6 pb-[72px] pt-[120px]">
        <CurrentPath />
        <h1 className="max-w-[620px] font-display text-[clamp(40px,8vw,60px)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          Mốc này không có trên dòng thời gian.
        </h1>
        <p className="max-w-[480px] text-base leading-relaxed text-[#c3c9d4]">
          Deadline không tồn tại hoặc đã bị lớp trưởng xoá.
        </p>
        <div className="flex flex-wrap gap-3 pt-1.5">
          <Link
            href="/deadlines"
            className="flex min-h-[52px] items-center rounded-card bg-lime px-[22px] font-extrabold text-ink hover:text-ink"
          >
            Xem tất cả deadline
          </Link>
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
