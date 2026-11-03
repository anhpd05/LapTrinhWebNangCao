import Link from 'next/link';
import { StatusChip } from '@/components/time/status-chip';
import { statusOf } from '@/lib/countdown';
import { formatDayMonth } from '@/lib/format';
import type { Deadline } from '@/lib/types';

const TILE_CLASS = {
  late: 'bg-late-bg text-late',
  soon: 'bg-ink text-lime',
  ok: 'bg-paper text-ink',
} as const;

interface SameSubjectListProps {
  subjectName: string;
  /** các deadline khác cùng môn (đã loại deadline đang xem) */
  deadlines: Deadline[];
  renderedAt: number;
}

// Server Component: màu ô ngày tính theo giờ server lúc render; chip trạng thái là client island
// nên tự cập nhật theo giờ thật sau khi mount.
export function SameSubjectList({ subjectName, deadlines, renderedAt }: SameSubjectListProps) {
  return (
    <section className="flex flex-col gap-4 rounded-panel border border-line bg-card p-[26px]">
      <h2 className="font-display text-2xl font-bold">Cùng môn {subjectName}</h2>
      {deadlines.length === 0 ? (
        <p className="text-[15px] text-muted">Môn này chưa có deadline khác.</p>
      ) : (
        <ul className="flex list-none flex-col p-0">
          {deadlines.map((d) => (
            <li key={d.id} className="border-t border-[#eef0f3]">
              <Link
                href={`/deadlines/${d.id}`}
                className="flex min-h-14 items-center gap-3.5 py-1.5 text-ink hover:text-ink"
              >
                <span
                  className={`flex size-[46px] flex-none items-center justify-center rounded-xl font-mono font-extrabold ${TILE_CLASS[statusOf(d.dueAt, renderedAt)]}`}
                >
                  {formatDayMonth(d.dueAt).slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{d.title}</span>
                <StatusChip dueAt={d.dueAt} renderedAt={renderedAt} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
