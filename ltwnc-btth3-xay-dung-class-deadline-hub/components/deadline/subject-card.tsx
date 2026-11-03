import type { CSSProperties } from 'react';
import Link from 'next/link';
import { NextUp } from '@/components/time/next-up';
import type { Deadline, Subject } from '@/lib/types';

interface SubjectCardProps {
  subject: Subject;
  /** deadline của môn này, đã sắp theo hạn tăng dần */
  deadlines: Pick<Deadline, 'title' | 'dueAt'>[];
  renderedAt: number;
}

// Mã môn cỡ lớn làm hình nền được vẽ bằng `.subject-card::before` (globals.css) từ data-code/--wm.
export function SubjectCard({ subject, deadlines, renderedAt }: SubjectCardProps) {
  return (
    <Link
      href={`/subjects/${subject.slug}`}
      data-code={subject.code}
      style={{ '--wm': subject.color.bg } as CSSProperties}
      className="subject-card reveal relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-panel border border-line bg-card p-[22px] text-ink hover:border-[#cfd3db] hover:text-ink"
    >
      <span className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-[10px] rounded-[3px]" style={{ background: subject.color.c }} />
          <span className="font-mono text-[13px] font-bold" style={{ color: subject.color.ink }}>
            {subject.code}
          </span>
        </span>
        <span className="rounded-pill bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-muted">
          {deadlines.length} deadline
        </span>
      </span>
      <span className="relative flex items-center justify-between gap-2">
        <span className="font-display text-2xl font-bold">{subject.name}</span>
        <span aria-hidden="true" className="card-go font-display text-xl font-bold" style={{ color: subject.color.ink }}>
          →
        </span>
      </span>
      <NextUp deadlines={deadlines} renderedAt={renderedAt} />
    </Link>
  );
}
