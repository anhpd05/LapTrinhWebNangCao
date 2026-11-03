'use client';

import { useNow } from '@/hooks/use-now';
import { calendarDaysLeft, msLeft } from '@/lib/countdown';

interface SubjectStatsProps {
  /** hạn nộp (ISO) của mọi deadline thuộc môn */
  dueDates: string[];
  /** màu chấm của môn, tô cho số "tới deadline kế tiếp" */
  color: string;
  renderedAt: number;
}

export function SubjectStats({ dueDates, color, renderedAt }: SubjectStatsProps) {
  const now = useNow(renderedAt, 60_000);

  const late = dueDates.filter((due) => msLeft(due, now) < 0).length;
  const upcoming = dueDates.filter((due) => msLeft(due, now) >= 0).sort((a, b) => Date.parse(a) - Date.parse(b));
  const nextIn = upcoming.length > 0 ? `${calendarDaysLeft(upcoming[0], now)} ngày` : '–';

  return (
    <dl className="flex flex-wrap gap-8 border-t border-line-dark pt-[18px]">
      <div className="flex flex-col-reverse">
        <dt className="text-[13px] text-muted-dark">deadline</dt>
        <dd className="font-mono text-[32px] font-extrabold">{dueDates.length}</dd>
      </div>
      <div className="flex flex-col-reverse">
        <dt className="text-[13px] text-muted-dark">quá hạn</dt>
        <dd className="font-mono text-[32px] font-extrabold text-[#ff8a80]">{late}</dd>
      </div>
      <div className="flex flex-col-reverse">
        <dt className="text-[13px] text-muted-dark">tới deadline kế tiếp</dt>
        <dd className="font-mono text-[32px] font-extrabold" style={{ color }}>
          {nextIn}
        </dd>
      </div>
    </dl>
  );
}
