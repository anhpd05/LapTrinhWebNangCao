import Link from 'next/link';
import { SubjectTag } from '@/components/deadline/subject-tag';
import { CompleteToggle } from '@/components/progress/complete-toggle';
import { daysLeft, statusOf } from '@/lib/countdown';
import { formatDayMonth } from '@/lib/format';
import type { Deadline, Subject } from '@/lib/types';

interface TaskBoardProps {
  deadlines: Deadline[];
  subjects: Subject[];
  completedIds: string[];
  /** Date.now() của server: SSR nên chia cột theo giờ server, không có hydration mismatch. */
  now: number;
}

type ColumnKey = 'late' | 'soon' | 'ok' | 'done';

const COLUMNS: { key: ColumnKey; label: string; dot: string; bg: string }[] = [
  { key: 'late', label: 'Quá hạn', dot: '#E0453A', bg: '#FFF1EF' },
  { key: 'soon', label: 'Trong 72 giờ', dot: '#F2A33A', bg: '#FFF6E6' },
  { key: 'ok', label: 'Còn thời gian', dot: '#9AA3B2', bg: '#E8EAEE' },
  { key: 'done', label: 'Đã xong', dot: '#1E8E5A', bg: '#E4F5EB' },
];

export function TaskBoard({ deadlines, subjects, completedIds, now }: TaskBoardProps) {
  const done = new Set(completedIds);
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const columns: Record<ColumnKey, Deadline[]> = { late: [], soon: [], ok: [], done: [] };
  const sorted = [...deadlines].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  for (const d of sorted) {
    columns[done.has(d.id) ? 'done' : statusOf(d.dueAt, now)].push(d);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => (
        <section
          key={col.key}
          aria-labelledby={`col-${col.key}`}
          className="flex min-w-0 flex-col gap-2.5 rounded-[18px] p-3 md:min-h-[380px]"
          style={{ backgroundColor: col.bg }}
        >
          <header className="flex items-center gap-2 p-1">
            <span aria-hidden="true" className="size-2.5 rounded-pill" style={{ backgroundColor: col.dot }} />
            <h3 id={`col-${col.key}`} className="text-[15px] font-bold">
              {col.label}
            </h3>
            <span className="ml-auto rounded-pill bg-card px-2 py-0.5 font-mono text-xs font-bold">
              {columns[col.key].length}
            </span>
          </header>
          <ul className="flex flex-col gap-2.5">
            {columns[col.key].map((d) => {
              const isDone = col.key === 'done';
              const subject = subjectByCode.get(d.subjectCode);
              const days = daysLeft(d.dueAt, now);
              const late = !isDone && col.key === 'late';
              return (
                <li key={d.id} className="flex gap-2.5 rounded-card border border-line bg-card p-3">
                  <CompleteToggle id={d.id} title={d.title} initialDone={isDone} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link
                      href={`/deadlines/${d.id}`}
                      className={`text-sm font-semibold leading-[1.35] hover:text-ink ${
                        isDone ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {d.title}
                    </Link>
                    <div className="flex items-center justify-between gap-1.5">
                      {subject ? <SubjectTag subject={subject} /> : <span className="font-mono text-xs">{d.subjectCode}</span>}
                      <span
                        className={`font-mono text-xs font-bold ${
                          isDone ? 'text-[#11663f]' : late ? 'text-late' : 'text-[#3d4350]'
                        }`}
                      >
                        {isDone ? 'Xong' : late ? `−${-days} ngày` : formatDayMonth(d.dueAt)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
