import type { CSSProperties } from 'react';
import Link from 'next/link';
import { TimelineNow } from '@/components/time/timeline-now';
import { formatDayMonth } from '@/lib/format';
import { buildTimelineLayout, pctOf, weekIndexOf, type TimelineLayout } from '@/lib/timeline-layout';
import type { Deadline, Subject } from '@/lib/types';

interface TimelineProps {
  deadlines: Deadline[];
  subjects: Subject[];
  /** `Date.now()` lúc server render, dùng để dựng trạng thái ban đầu của mốc quá hạn */
  renderedAt: number;
}

// Mốc quá hạn do TimelineNow bật bằng data-late (client, theo giờ thật); server cũng gán sẵn
// theo `renderedAt` nên HTML tĩnh không bị nháy.
const PIN_CLASS =
  'absolute top-1/2 z-10 inline-flex h-11 -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap rounded-pill border-[1.5px] border-solid border-(--pin) bg-(--pin) px-3 font-mono text-xs font-bold text-ink hover:text-ink ' +
  'data-[late=true]:border-dashed data-[late=true]:border-[#7A3A36] data-[late=true]:bg-[#0F1219] data-[late=true]:text-[#FF8A80] data-[late=true]:hover:text-[#FF8A80] ' +
  'data-[next=true]:shadow-[0_0_0_3px_#0F1219,0_0_0_5px_#D4FF3A]';

const ITEM_CLASS =
  'group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-field border border-solid border-line-dark bg-ink-2 p-3 text-[#F4F5F7] hover:text-white ' +
  'data-[late=true]:border-dashed data-[late=true]:border-[#7A3A36] ' +
  'data-[next=true]:shadow-[0_0_0_2px_#D4FF3A]';

const ITEM_DATE_CLASS =
  'rounded-pill border-[1.5px] border-solid border-(--pin) bg-(--pin) px-3 py-1 font-mono text-xs font-bold text-ink ' +
  'group-data-[late=true]:border-dashed group-data-[late=true]:border-[#7A3A36] group-data-[late=true]:bg-[#0F1219] group-data-[late=true]:text-[#FF8A80]';

export function Timeline({ deadlines, subjects, renderedAt }: TimelineProps) {
  const layout = buildTimelineLayout(
    deadlines.map((d) => d.dueAt),
    renderedAt,
  );
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  return (
    <section
      aria-labelledby="timeline-heading"
      className="relative mx-auto max-w-[1280px] px-6 pb-12 pt-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3">
        <h2 id="timeline-heading" className="font-display text-[22px] font-bold">
          Dòng thời gian · {layout.rangeLabel}
        </h2>
        <p className="text-[13px] text-muted-dark">Mốc viền đứt = đã quá hạn · vạch vàng chanh = hôm nay</p>
      </div>

      <div data-timeline="">
        {/* Desktop: lưới 4 làn x các tuần, cuộn ngang khi hẹp */}
        <div className="hidden overflow-x-auto rounded-[18px] border border-line-dark bg-[#0F1219] md:block">
          <div className="relative grid min-w-[960px] grid-cols-[150px_minmax(0,1fr)]">
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[150px] right-0 top-[38px] z-0">
              {layout.weeks.map((w) => (
                <div key={w.index} className="absolute inset-y-0 border-l border-line-dark" style={{ left: `${w.left}%` }} />
              ))}
            </div>
            <TimelineNow renderedAt={renderedAt} startMs={layout.startMs} spanMs={layout.spanMs} />

            <div className="border-b border-line-dark" />
            <div className="relative h-[38px] border-b border-line-dark">
              {layout.weeks.map((w) => (
                <span
                  key={w.index}
                  className="absolute inset-y-0 whitespace-nowrap border-l border-line-dark px-[10px] py-[11px] font-mono text-xs text-muted-dark"
                  style={{ left: `${w.left}%` }}
                >
                  {w.label}
                </span>
              ))}
            </div>

            {subjects.map((subject) => (
              <LaneRow
                key={subject.code}
                subject={subject}
                deadlines={deadlines.filter((d) => d.subjectCode === subject.code)}
                layout={layout}
                renderedAt={renderedAt}
              />
            ))}
          </div>
        </div>

        {/* Mobile < 768px: danh sách dọc theo tuần */}
        <div className="flex flex-col gap-5 md:hidden">
          {layout.weeks.map((w) => {
            const inWeek = deadlines.filter((d) => weekIndexOf(layout, Date.parse(d.dueAt)) === w.index);
            return (
              <section key={w.index} aria-label={w.label} className="flex flex-col gap-2">
                <h3 className="font-mono text-xs font-bold tracking-[0.08em] text-muted-dark">{w.label}</h3>
                {inWeek.length === 0 ? (
                  <p className="text-sm text-muted-dark">Không có deadline.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {inWeek.map((d) => {
                      const subject = subjectByCode.get(d.subjectCode);
                      return (
                        <li key={d.id}>
                          <Link
                            href={`/deadlines/${d.id}`}
                            data-due={d.dueAt}
                            data-late={String(Date.parse(d.dueAt) < renderedAt)}
                            className={ITEM_CLASS}
                            style={{ '--pin': subject?.color.c } as CSSProperties}
                          >
                            <span className={ITEM_DATE_CLASS}>{formatDayMonth(d.dueAt)}</span>
                            <span className="flex min-w-0 flex-col leading-snug">
                              <span className="text-sm font-semibold">{d.title}</span>
                              <span className="text-xs text-muted-dark">
                                {subject?.name ?? d.subjectCode}
                                <span className="hidden group-data-[late=true]:inline"> · Quá hạn</span>
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LaneRow({
  subject,
  deadlines,
  layout,
  renderedAt,
}: {
  subject: Subject;
  deadlines: Deadline[];
  layout: TimelineLayout;
  renderedAt: number;
}) {
  return (
    <>
      <Link
        href={`/subjects/${subject.slug}`}
        className="flex h-16 items-center gap-[10px] border-b border-[#1C212B] px-4 text-[#F4F5F7] hover:text-white"
      >
        <span aria-hidden="true" className="size-[10px] rounded-[3px]" style={{ background: subject.color.c }} />
        <span className="flex flex-col leading-tight">
          <span className="font-mono text-[13px] font-bold">{subject.code}</span>
          <span className="text-xs text-muted-dark">{subject.name}</span>
        </span>
      </Link>
      <div className="relative z-10 h-16 border-b border-[#1C212B]">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line-dark" />
        {deadlines.map((d) => (
          <Link
            key={d.id}
            href={`/deadlines/${d.id}`}
            aria-label={`${d.title}, hạn ${formatDayMonth(d.dueAt)}`}
            data-due={d.dueAt}
            data-late={String(Date.parse(d.dueAt) < renderedAt)}
            className={PIN_CLASS}
            style={{ left: `${pctOf(layout, Date.parse(d.dueAt))}%`, '--pin': subject.color.c } as CSSProperties}
          >
            {formatDayMonth(d.dueAt)}
          </Link>
        ))}
      </div>
    </>
  );
}
