'use client';

import Link from 'next/link';
import { useNow } from '@/hooks/use-now';
import { calendarDaysLeft, daysLeft, msLeft } from '@/lib/countdown';
import { formatDayMonth } from '@/lib/format';

interface SubjectDeadlineCardsProps {
  deadlines: { id: string; title: string; dueAt: string }[];
  renderedAt: number;
}

type CardKind = 'late' | 'next' | 'upcoming';

const CARD_CLASS: Record<CardKind, string> = {
  next: 'border-ink bg-ink text-white',
  late: 'border-[#f6cfc9] bg-[#fff1ef] text-ink',
  upcoming: 'border-line bg-card text-ink',
};

const BADGE_CLASS: Record<CardKind, string> = {
  next: 'bg-lime text-ink',
  late: 'bg-card text-late',
  upcoming: 'bg-ok-bg text-ok',
};

const BADGE_TEXT: Record<CardKind, string> = {
  next: 'Kế tiếp',
  late: 'Quá hạn',
  upcoming: 'Sắp tới',
};

// Thẻ deadline của một môn. Nhãn và số ngày phụ thuộc "bây giờ" nên là client island:
// lần render đầu dùng `renderedAt` của server, sau khi mount cập nhật mỗi 60 giây.
export function SubjectDeadlineCards({ deadlines, renderedAt }: SubjectDeadlineCardsProps) {
  const now = useNow(renderedAt, 60_000);

  const nextId = deadlines
    .filter((d) => msLeft(d.dueAt, now) >= 0)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))[0]?.id;

  return (
    <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4 p-0">
      {deadlines.map((d) => {
        const isLate = msLeft(d.dueAt, now) < 0;
        const kind: CardKind = isLate ? 'late' : d.id === nextId ? 'next' : 'upcoming';
        const num = isLate ? -daysLeft(d.dueAt, now) : calendarDaysLeft(d.dueAt, now);
        const subColor = kind === 'next' ? 'text-muted-dark' : 'text-muted';
        const numColor = kind === 'next' ? 'text-lime' : kind === 'late' ? 'text-late' : 'text-ink';

        return (
          <li key={d.id} className="flex">
            <Link
              href={`/deadlines/${d.id}`}
              className={`flex min-h-[240px] w-full flex-col gap-3.5 rounded-[22px] border p-[22px] ${CARD_CLASS[kind]}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className={`font-mono text-[13px] ${subColor}`}>
                  #{d.id} · {formatDayMonth(d.dueAt)}
                </span>
                <span className={`rounded-pill px-2.5 py-1 font-mono text-xs font-bold ${BADGE_CLASS[kind]}`}>
                  {BADGE_TEXT[kind]}
                </span>
              </span>
              <span className="font-display text-[25px] font-bold leading-[1.12]">{d.title}</span>
              <span className="mt-auto flex items-baseline gap-2">
                <span
                  className={`font-display text-[60px] font-extrabold leading-[0.9] tracking-[-0.04em] ${numColor}`}
                >
                  {num}
                </span>
                <span className={`text-[15px] font-semibold ${subColor}`}>
                  {isLate ? 'ngày quá hạn' : 'ngày còn lại'}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
