import Link from 'next/link';
import { SubjectTag } from '@/components/deadline/subject-tag';
import { DateTile } from '@/components/deadline/date-tile';
import { StatusChip } from '@/components/time/status-chip';
import { statusOf } from '@/lib/countdown';
import { formatDayMonth, formatDue } from '@/lib/format';
import type { Deadline, Subject } from '@/lib/types';

interface DeadlineRowProps {
  deadline: Deadline;
  subject: Subject;
  /** Thời điểm "bây giờ" do component cha (client) cung cấp; không tự gọi Date.now(). */
  now: number;
  done?: boolean;
  /** Chỗ cho ô tick CompleteToggle ở phase 4. */
  leading?: React.ReactNode;
}

// Presentational: không có state/effect riêng, chỉ ghép DateTile + tag + chip.
// Được import bởi DeadlineExplorer (client) nên chạy ở client, nhưng không cần 'use client'.
export function DeadlineRow({ deadline, subject, now, done = false, leading }: DeadlineRowProps) {
  const status = done ? 'done' : statusOf(deadline.dueAt, now);
  const time = formatDue(deadline.dueAt).split(' · ')[0];

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3.5 rounded-2xl border border-line bg-card px-[18px] py-3.5">
      {leading}
      <DateTile dueAt={deadline.dueAt} status={status} />
      <Link
        href={`/deadlines/${deadline.id}`}
        className="flex min-w-0 flex-[999_1_260px] flex-col gap-2 text-ink no-underline hover:text-ink"
      >
        <span
          className={`text-[17px] font-semibold leading-[1.35] ${done ? 'text-muted line-through' : ''}`}
        >
          {deadline.title}
        </span>
        <span className="flex flex-wrap items-center gap-2.5">
          <SubjectTag subject={subject} />
          <span className="text-[13px] text-muted">
            {subject.name} · {time} {formatDayMonth(deadline.dueAt)}
          </span>
        </span>
      </Link>
      <StatusChip dueAt={deadline.dueAt} renderedAt={now} done={done} />
    </li>
  );
}
