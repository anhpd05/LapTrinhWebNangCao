import Link from 'next/link';
import { CountdownClock } from '@/components/time/countdown-clock';
import { formatDayMonth, formatDue } from '@/lib/format';
import type { Deadline, Subject } from '@/lib/types';
import { MarkDoneButton } from './mark-done-button';

interface PriorityCardProps {
  /** Deadline chưa xong và chưa quá hạn gần nhất; `null` khi không còn việc nào. */
  deadline: Deadline | null;
  subject?: Subject;
  /** Date.now() lúc server render, truyền cho đồng hồ để HTML server và lần render đầu ở client giống nhau. */
  renderedAt: number;
}

export function PriorityCard({ deadline, subject, renderedAt }: PriorityCardProps) {
  return (
    <section
      aria-label="Ưu tiên ngay"
      className="flex min-w-0 flex-[2_1_420px] flex-wrap items-center gap-5 rounded-[22px] bg-ink p-6 text-[#f4f5f7]"
    >
      {deadline ? (
        <>
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2.5">
            <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.1em] text-lime">
              <span aria-hidden="true" className="size-2 rounded-pill bg-lime" />
              ƯU TIÊN NGAY
            </span>
            <h2 className="text-[27px] leading-[1.1]">
              <Link
                href={`/deadlines/${deadline.id}`}
                className="font-display font-extrabold text-white hover:text-white hover:underline"
              >
                {deadline.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-dark">
              {deadline.subjectCode}
              {subject ? ` · ${subject.name}` : ''} · hạn {formatDue(deadline.dueAt).split(' · ')[0]},{' '}
              {formatDayMonth(deadline.dueAt)}
            </p>
            <MarkDoneButton id={deadline.id} title={deadline.title} />
          </div>
          <div className="min-w-0 flex-[1_1_240px]">
            <CountdownClock dueAt={deadline.dueAt} renderedAt={renderedAt} showSeconds={false} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[30px] font-extrabold text-lime">Sạch bóng deadline sắp tới.</h2>
          <p className="text-[#c3c9d4]">Không còn việc nào chưa xong trước hạn.</p>
        </div>
      )}
    </section>
  );
}
