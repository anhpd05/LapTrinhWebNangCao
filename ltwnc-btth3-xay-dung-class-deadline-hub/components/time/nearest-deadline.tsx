'use client';

import Link from 'next/link';
import { CountdownClock } from '@/components/time/countdown-clock';
import { useNow } from '@/hooks/use-now';
import { formatDayMonth, formatDue } from '@/lib/format';
import type { Deadline, Subject } from '@/lib/types';

interface NearestDeadlineProps {
  deadlines: Pick<Deadline, 'id' | 'title' | 'subjectCode' | 'dueAt'>[];
  subjects: Pick<Subject, 'code' | 'name' | 'color'>[];
  renderedAt: number;
}

/** Thẻ "Deadline gần nhất": chọn deadline chưa quá hạn gần nhất theo giờ hiện tại. */
export function NearestDeadline({ deadlines, subjects, renderedAt }: NearestDeadlineProps) {
  const now = useNow(renderedAt, 60_000);

  // `deadlines` đã sắp theo hạn tăng dần. Hết deadline sắp tới thì lấy cái vừa quá hạn gần nhất.
  const sel = deadlines.find((d) => Date.parse(d.dueAt) >= now) ?? deadlines[deadlines.length - 1];
  const subject = sel ? subjects.find((s) => s.code === sel.subjectCode) : undefined;
  const late = sel ? Date.parse(sel.dueAt) < now : false;

  return (
    <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-panel border border-line-dark bg-ink-2 p-[22px] shadow-[0_30px_80px_-20px_#000]">
      {sel && subject ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs tracking-[0.1em] text-muted-dark">
              {late ? 'ĐÃ QUÁ HẠN' : 'DEADLINE GẦN NHẤT'}
            </span>
            <span
              className="rounded-pill px-[10px] py-1 font-mono text-xs font-bold text-ink"
              style={{ background: subject.color.c }}
            >
              {subject.code}
            </span>
          </div>
          <span className="font-display text-2xl font-bold leading-[1.15]">{sel.title}</span>
          <span className="-mt-2 text-sm text-muted-dark">
            {subject.name} · hạn {formatDue(sel.dueAt).split(' · ')[0]}, {formatDayMonth(sel.dueAt)}
          </span>
          <CountdownClock dueAt={sel.dueAt} renderedAt={renderedAt} />
          <Link
            href={`/deadlines/${sel.id}`}
            className="inline-flex min-h-12 items-center justify-between rounded-field bg-[#F4F5F7] px-[18px] font-bold text-ink hover:text-ink"
          >
            Xem chi tiết
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </>
      ) : (
        <>
          <span className="font-mono text-xs tracking-[0.1em] text-muted-dark">DEADLINE GẦN NHẤT</span>
          <span className="font-display text-2xl font-bold leading-[1.15]">Chưa có deadline nào.</span>
          <Link
            href="/deadlines"
            className="inline-flex min-h-12 items-center rounded-field bg-[#F4F5F7] px-[18px] font-bold text-ink hover:text-ink"
          >
            Xem tất cả deadline
          </Link>
        </>
      )}
    </div>
  );
}
