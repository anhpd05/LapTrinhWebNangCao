'use client';

import { useMemo, useState } from 'react';
import { DeadlineRow } from '@/components/deadline/deadline-row';
import { CompleteToggle } from '@/components/progress/complete-toggle';
import { useProgress } from '@/components/progress/progress-provider';
import { useNow } from '@/hooks/use-now';
import { statusOf, weekBucket, type DeadlineStatus, type WeekBucket } from '@/lib/countdown';
import type { Deadline, Subject, SubjectCode } from '@/lib/types';

// Bộ lọc chỉ giữ bằng useState (KHÔNG dùng useSearchParams): trên trang ISR, useSearchParams
// khiến phần trong <Suspense> không được prerender và danh sách sẽ vắng mặt trong HTML.
// Lần render đầu `now = renderedAt` (giờ server) và chưa có bộ lọc nên toàn bộ danh sách có trong HTML.

type SubjectFilter = 'all' | SubjectCode;
type StatusFilter = 'all' | DeadlineStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'late', label: 'Quá hạn' },
  { value: 'soon', label: '≤ 3 ngày' },
  { value: 'ok', label: 'Còn thời gian' },
];

const GROUPS: { bucket: WeekBucket; label: string; dot: string }[] = [
  { bucket: 'late', label: 'Quá hạn', dot: '#E0453A' },
  { bucket: 'thisWeek', label: 'Tuần này', dot: '#F2A33A' },
  { bucket: 'nextWeek', label: 'Tuần sau', dot: '#7AA2FF' },
  { bucket: 'later', label: 'Sau đó', dot: '#9AA3B2' },
];

const DAY = 24 * 60 * 60 * 1000;
const VN_OFFSET = 7 * 60 * 60 * 1000;

function ddmm(dayIndex: number): string {
  const d = new Date(dayIndex * DAY);
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Nhãn khoảng ngày của từng nhóm, tính theo lịch giờ VN, tuần bắt đầu thứ Hai. */
function groupRanges(now: number): Record<WeekBucket, string> {
  const today = Math.floor((now + VN_OFFSET) / DAY);
  // ngày 0 (1970-01-01) là thứ Năm nên (today + 3) % 7 = số ngày kể từ thứ Hai
  const monday = today - ((today + 3) % 7);
  return {
    late: `trước ${ddmm(today)}`,
    thisWeek: `${ddmm(monday)} – ${ddmm(monday + 6)}`,
    nextWeek: `${ddmm(monday + 7)} – ${ddmm(monday + 13)}`,
    later: `từ ${ddmm(monday + 14)}`,
  };
}

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd');
}

/** 3 ô đếm trên band tối (Quá hạn / Trong 72 giờ / Còn thời gian), tính theo giờ client. */
export function DeadlineCounters({ deadlines, renderedAt }: { deadlines: Deadline[]; renderedAt: number }) {
  const now = useNow(renderedAt, 60_000);
  const counts = { late: 0, soon: 0, ok: 0 };
  for (const d of deadlines) counts[statusOf(d.dueAt, now)] += 1;

  return (
    <dl className="m-0 flex flex-wrap gap-2.5">
      <div className="flex flex-col-reverse rounded-card border border-[#3A2020] bg-[#1A1012] px-[18px] py-3">
        <dt className="text-xs text-[#D9B3AF]">Quá hạn</dt>
        <dd className="m-0 font-mono text-[26px] font-extrabold leading-tight text-[#FF8A80]">{counts.late}</dd>
      </div>
      <div className="flex flex-col-reverse rounded-card border border-[#3D3016] bg-[#1A1610] px-[18px] py-3">
        <dt className="text-xs text-[#DCCBAA]">Trong 72 giờ</dt>
        <dd className="m-0 font-mono text-[26px] font-extrabold leading-tight text-[#FFC266]">{counts.soon}</dd>
      </div>
      <div className="flex flex-col-reverse rounded-card border border-line-dark bg-ink-2 px-[18px] py-3">
        <dt className="text-xs text-muted-dark">Còn thời gian</dt>
        <dd className="m-0 font-mono text-[26px] font-extrabold leading-tight">{counts.ok}</dd>
      </div>
    </dl>
  );
}

interface DeadlineExplorerProps {
  deadlines: Deadline[];
  subjects: Subject[];
  renderedAt: number;
}

export function DeadlineExplorer({ deadlines, subjects, renderedAt }: DeadlineExplorerProps) {
  const now = useNow(renderedAt, 60_000);
  const progress = useProgress();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const subjectByCode = useMemo(() => new Map(subjects.map((s) => [s.code, s])), [subjects]);
  const sorted = useMemo(
    () => [...deadlines].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt)),
    [deadlines],
  );

  const needle = fold(query.trim());
  const filtered = sorted.filter(
    (d) =>
      (subject === 'all' || d.subjectCode === subject) &&
      (status === 'all' || statusOf(d.dueAt, now) === status) &&
      (needle === '' || fold(d.title).includes(needle)),
  );

  const ranges = groupRanges(now);
  const groups = GROUPS.map((g) => ({
    ...g,
    range: ranges[g.bucket],
    rows: filtered.filter((d) => weekBucket(d.dueAt, now) === g.bucket),
  })).filter((g) => g.rows.length > 0);

  const reset = () => {
    setQuery('');
    setSubject('all');
    setStatus('all');
  };

  return (
    <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-7 px-6 pb-[72px] pt-7">
      <aside
        aria-label="Bộ lọc"
        className="flex min-w-0 flex-[1_1_260px] flex-col gap-[22px] rounded-panel border border-line bg-card p-5"
      >
        <label className="flex min-h-[46px] items-center gap-2.5 rounded-field border border-[#D5D9E0] bg-[#F6F7F9] px-3.5 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-link">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A6170"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className="sr-only">Tìm deadline</span>
          <input
            type="search"
            placeholder="Tìm deadline…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-auto border-none bg-transparent text-[15px] outline-none"
          />
        </label>

        <div role="group" aria-label="Lọc theo môn học" className="flex flex-col gap-1.5">
          <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">MÔN HỌC</span>
          <SubjectButton
            label="Tất cả môn"
            color="#0B0D12"
            count={sorted.length}
            on={subject === 'all'}
            onClick={() => setSubject('all')}
          />
          {subjects.map((s) => (
            <SubjectButton
              key={s.code}
              label={s.name}
              color={s.color.c}
              count={sorted.filter((d) => d.subjectCode === s.code).length}
              on={subject === s.code}
              onClick={() => setSubject(s.code)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">TRẠNG THÁI</span>
          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((o) => {
              const on = status === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setStatus(o.value)}
                  className={`min-h-11 rounded-pill border px-3.5 text-sm font-semibold ${
                    on ? 'border-ink bg-lime text-ink' : 'border-[#D5D9E0] bg-card text-ok'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-field border border-dashed border-[#C4C9D2] bg-transparent text-sm font-semibold text-[#3D4350]"
        >
          Xoá bộ lọc
        </button>
      </aside>

      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-6">
        <p className="m-0 text-[15px] text-[#3D4350]" aria-live="polite">
          Hiển thị <strong className="font-mono text-ink">{filtered.length}</strong> / {sorted.length} deadline
        </p>

        {groups.map((g) => (
          <section key={g.bucket} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-pill"
                style={{ background: g.dot }}
              />
              <h2 className="m-0 font-display text-[22px] font-bold">{g.label}</h2>
              <span className="font-mono text-[13px] text-muted">{g.range}</span>
              <span aria-hidden="true" className="h-px flex-auto bg-[#DADDE3]" />
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {g.rows.map((d) => {
                const s = subjectByCode.get(d.subjectCode);
                if (!s) return null;
                return (
                  <DeadlineRow
                    key={d.id}
                    deadline={d}
                    subject={s}
                    now={now}
                    done={progress.status === 'authenticated' && progress.completed.has(d.id)}
                    leading={<CompleteToggle id={d.id} title={d.title} />}
                  />
                );
              })}
            </ul>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-[#C4C9D2] bg-card px-6 py-14 text-center">
            <span className="font-display text-2xl font-bold">Không có deadline nào khớp</span>
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-field bg-ink px-[18px] font-semibold text-white"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectButton({
  label,
  color,
  count,
  on,
  onClick,
}: {
  label: string;
  color: string;
  count: number;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2.5 rounded-field border px-3 text-[15px] font-semibold ${
        on ? 'border-ink bg-ink text-white' : 'border-transparent bg-transparent text-ink'
      }`}
    >
      {label === 'Tất cả môn' ? (
        <span aria-hidden="true" className="size-3" />
      ) : (
        <span aria-hidden="true" className="size-3 rounded" style={{ background: color }} />
      )}
      <span className="flex-auto text-left">{label}</span>
      <span className="font-mono text-[13px] opacity-75">{count}</span>
    </button>
  );
}
