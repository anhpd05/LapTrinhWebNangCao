'use client';

import { useEffect, useRef } from 'react';
import { useNow } from '@/hooks/use-now';

interface TimelineNowProps {
  renderedAt: number;
  /** 00:00 thứ Hai của tuần đầu tiên (ms) */
  startMs: number;
  spanMs: number;
}

/**
 * Vẽ vùng quá khứ + vạch "hôm nay" trên lưới dòng thời gian (desktop) và gắn trạng thái
 * `data-late` / `data-next` cho mọi mốc `[data-due]` nằm trong `[data-timeline]` gần nhất
 * (cả lưới desktop lẫn danh sách dọc mobile). Lần render đầu dùng `renderedAt` nên khớp HTML server.
 */
export function TimelineNow({ renderedAt, startMs, spanMs }: TimelineNowProps) {
  const now = useNow(renderedAt, 60_000);
  const ref = useRef<HTMLDivElement>(null);

  const pct = Math.min(100, Math.max(0, ((now - startMs) / spanMs) * 100));

  useEffect(() => {
    const root = ref.current?.closest('[data-timeline]');
    if (!root) return;
    const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-due]'));
    const dues = marks.map((el) => Date.parse(el.dataset.due ?? ''));
    const nextDue = Math.min(...dues.filter((due) => due >= now));
    marks.forEach((el, i) => {
      el.dataset.late = String(dues[i] < now);
      el.dataset.next = String(dues[i] === nextDue);
    });
  }, [now]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-[150px] right-0 top-[38px] z-0"
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background: 'repeating-linear-gradient(135deg, #1D1416 0 6px, transparent 6px 12px)',
        }}
      />
      <div className="absolute inset-y-0 w-0.5 bg-lime" style={{ left: `${pct}%` }} />
    </div>
  );
}
