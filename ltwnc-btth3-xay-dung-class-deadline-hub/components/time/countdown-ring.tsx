'use client';

import { useNow } from '@/hooks/use-now';
import { clockParts, msLeft } from '@/lib/countdown';

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 816.8
const DAY_MS = 24 * 60 * 60 * 1000;
// Vòng chạy trên cửa sổ 15 ngày: bắt đầu 14 ngày trước hạn, đầy vòng sau hạn 1 ngày (giống prototype).
const WINDOW_MS = 15 * DAY_MS;
const LATE_COLOR = '#FF8A80';
const LIME = '#D4FF3A';

const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownRing({ dueAt, renderedAt }: { dueAt: string; renderedAt: number }) {
  const now = useNow(renderedAt, 1_000);
  const late = msLeft(dueAt, now) < 0;
  const { d, h, m, s } = clockParts(dueAt, now);

  const elapsed = Math.max(0.02, Math.min(1, (now - (Date.parse(dueAt) - 14 * DAY_MS)) / WINDOW_MS));
  const color = late ? LATE_COLOR : LIME;

  const staticLabel = late
    ? 'Đã quá hạn'
    : d > 0
      ? `Còn ${d} ngày ${h} giờ`
      : h > 0
        ? `Còn ${h} giờ ${m} phút`
        : `Còn ${m} phút`;

  return (
    <div className="relative size-[300px] max-w-full">
      <svg
        viewBox="0 0 300 300"
        className="size-full"
        role="img"
        aria-label={`${staticLabel}. Đã trôi qua ${Math.round(elapsed * 100)}% thời gian làm bài`}
      >
        <circle cx="150" cy="150" r={RADIUS} fill="none" stroke="#1C212B" strokeWidth="18" />
        <circle
          cx="150"
          cy="150"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - elapsed)}
          transform="rotate(-90 150 150)"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className="font-mono text-xs tracking-[0.12em] text-muted-dark">
          {late ? 'ĐÃ QUÁ HẠN' : 'CÒN LẠI'}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span
            className="font-display text-[88px] font-extrabold leading-[0.9] tracking-[-0.04em]"
            style={{ color }}
          >
            {d}
          </span>
          <span className="text-lg font-bold">ngày</span>
        </span>
        <span className="font-mono text-xl font-bold">
          {pad(h)}:{pad(m)}:{pad(s)}
        </span>
      </div>
    </div>
  );
}
