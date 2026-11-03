'use client';

import { chipText, statusOf } from '@/lib/countdown';
import { useNow } from '@/hooks/use-now';

const TONE = {
  late: 'bg-late-bg text-late',
  soon: 'bg-soon-bg text-soon',
  ok: 'bg-ok-bg text-ok',
  done: 'bg-done-bg text-done',
} as const;

export function StatusChip({ dueAt, renderedAt, done = false }: { dueAt: string; renderedAt: number; done?: boolean }) {
  const now = useNow(renderedAt, 60_000);
  const tone = done ? TONE.done : TONE[statusOf(dueAt, now)];
  return (
    <span className={`whitespace-nowrap rounded-pill px-3 py-1.5 font-mono text-[13px] font-bold ${tone}`}>
      {chipText(dueAt, now, done)}
    </span>
  );
}
