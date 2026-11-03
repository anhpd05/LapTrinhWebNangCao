import Link from 'next/link';
import { NextUp } from '@/components/time/next-up';
import type { Deadline, Subject } from '@/lib/types';

interface SubjectCardProps {
  subject: Subject;
  /** deadline của môn này, đã sắp theo hạn tăng dần */
  deadlines: Pick<Deadline, 'title' | 'dueAt'>[];
  renderedAt: number;
}

export function SubjectCard({ subject, deadlines, renderedAt }: SubjectCardProps) {
  return (
    <Link
      href={`/subjects/${subject.slug}`}
      className="relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-panel border border-line bg-card p-[22px] text-ink hover:text-ink motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
    >
      <span
        aria-hidden="true"
        className="absolute -bottom-[22px] -right-1.5 font-display text-[108px] font-extrabold leading-none tracking-[-0.05em]"
        style={{ color: subject.color.bg }}
      >
        {subject.code}
      </span>
      <span className="relative flex items-center gap-2">
        <span aria-hidden="true" className="size-[10px] rounded-[3px]" style={{ background: subject.color.c }} />
        <span className="font-mono text-[13px] font-bold" style={{ color: subject.color.ink }}>
          {subject.code}
        </span>
      </span>
      <span className="relative font-display text-2xl font-bold">{subject.name}</span>
      <NextUp deadlines={deadlines} renderedAt={renderedAt} />
    </Link>
  );
}
