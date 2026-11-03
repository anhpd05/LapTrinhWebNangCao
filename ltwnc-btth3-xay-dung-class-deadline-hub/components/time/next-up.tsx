'use client';

import { useNow } from '@/hooks/use-now';
import { calendarDaysLeft, statusOf, type DeadlineStatus } from '@/lib/countdown';
import type { Deadline } from '@/lib/types';

const SEGMENT_COLOR: Record<DeadlineStatus, string> = {
  late: 'bg-[#E0453A]',
  soon: 'bg-[#F2A33A]',
  ok: 'bg-[#C9CED8]',
};

interface NextUpProps {
  /** deadline của một môn, đã sắp theo hạn tăng dần */
  deadlines: Pick<Deadline, 'title' | 'dueAt'>[];
  renderedAt: number;
}

/**
 * Hai khối cuối của thẻ môn: thanh vạch (mỗi vạch = 1 deadline, màu theo trạng thái)
 * và dòng "Tiếp theo". Trả về fragment để cả hai là con trực tiếp của thẻ flex-col.
 */
export function NextUp({ deadlines, renderedAt }: NextUpProps) {
  const now = useNow(renderedAt, 60_000);
  const next = deadlines.find((d) => Date.parse(d.dueAt) >= now);
  const days = next ? calendarDaysLeft(next.dueAt, now) : 0;

  return (
    <>
      <span aria-hidden="true" className="relative flex gap-1">
        {deadlines.map((d) => (
          <span
            key={d.dueAt + d.title}
            className={`seg-grow h-1.5 flex-1 rounded-pill ${SEGMENT_COLOR[statusOf(d.dueAt, now)]}`}
          />
        ))}
      </span>
      <span className="relative mt-auto flex flex-col gap-0.5">
        <span className="text-xs text-muted">Tiếp theo</span>
        <span className="text-sm font-semibold">
          {next
            ? `${next.title} · ${days === 0 ? 'hạn hôm nay' : `còn ${days} ngày`}`
            : 'Chưa có deadline sắp tới'}
        </span>
      </span>
    </>
  );
}
