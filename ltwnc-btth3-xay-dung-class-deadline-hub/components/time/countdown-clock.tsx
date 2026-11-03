'use client';

import { clockParts, msLeft } from '@/lib/countdown';
import { useNow } from '@/hooks/use-now';

/** Nhãn tĩnh cho trình đọc màn hình, không có aria-live nên không đọc lại mỗi giây. */
function staticLabel(d: number, h: number, m: number): string {
  if (d > 0) return `Còn ${d} ngày ${h} giờ`;
  if (h > 0) return `Còn ${h} giờ ${m} phút`;
  return `Còn ${m} phút`;
}

export function CountdownClock({
  dueAt,
  renderedAt,
  showSeconds = true,
}: {
  dueAt: string;
  renderedAt: number;
  /** `false` ẩn ô GIÂY (dashboard chỉ hiện NGÀY/GIỜ/PHÚT) và cập nhật mỗi 10 giây thay vì mỗi giây. */
  showSeconds?: boolean;
}) {
  const now = useNow(renderedAt, showSeconds ? 1_000 : 10_000);
  const late = msLeft(dueAt, now) < 0;
  const { d, h, m, s } = clockParts(dueAt, now);
  const cells = [
    { v: d, l: 'NGÀY' },
    { v: h, l: 'GIỜ' },
    { v: m, l: 'PHÚT' },
    ...(showSeconds ? [{ v: s, l: 'GIÂY' }] : []),
  ];
  return (
    <div>
      <span className="sr-only">{late ? 'Đã quá hạn' : staticLabel(d, h, m)}</span>
      <div aria-hidden="true" className={`grid gap-2 ${showSeconds ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {cells.map((c) => (
          <div
            key={c.l}
            className="flex flex-col items-center gap-1 rounded-field border border-[#222733] bg-ink px-1 py-3"
          >
            <span
              className={`font-mono text-[30px] font-extrabold leading-none ${late ? 'text-[#ff8a80]' : 'text-lime'}`}
            >
              {String(c.v).padStart(2, '0')}
            </span>
            <span className="text-[11px] tracking-[0.08em] text-[#8f98a8]">{c.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
