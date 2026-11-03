import { formatDayMonth, weekdayShort } from '@/lib/format';

type Status = 'late' | 'soon' | 'ok' | 'done';

const TONE: Record<Status, string> = {
  late: 'bg-late-bg text-late',
  soon: 'bg-ink text-lime',
  ok: 'bg-paper text-ink',
  done: 'bg-done-bg text-done',
};

export function DateTile({ dueAt, status }: { dueAt: string; status: Status }) {
  const dayMonth = formatDayMonth(dueAt);
  return (
    <span
      className={`flex size-[60px] flex-none flex-col items-center justify-center rounded-card ${TONE[status]}`}
      title={dayMonth}
    >
      <span className="font-mono text-[22px] font-extrabold leading-none">{dayMonth.slice(0, 2)}</span>
      <span className="text-[11px] font-semibold">{weekdayShort(dueAt)}</span>
    </span>
  );
}
