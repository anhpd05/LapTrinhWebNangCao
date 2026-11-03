const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  done: number;
  total: number;
  lateCount: number;
}

// Server Component: vòng tĩnh (không animate) nên không cần xử lý prefers-reduced-motion.
export function ProgressRing({ done, total, lateCount }: ProgressRingProps) {
  const ratio = total > 0 ? done / total : 0;
  const pct = Math.round(ratio * 100);

  return (
    <section
      aria-label="Tiến độ học kỳ"
      className="flex min-w-0 flex-[1_1_260px] items-center gap-5 rounded-[22px] border border-line bg-card p-6"
    >
      <div className="relative size-32 flex-none">
        <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`Đã xong ${done} trên ${total} deadline`}>
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#ECEEF2" strokeWidth="14" />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="#0B0D12"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            transform="rotate(-90 64 64)"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-[34px] font-extrabold"
        >
          {pct}%
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[22px] font-bold">Tiến độ học kỳ</h2>
        <p className="text-[15px] text-[#3d4350]">
          <strong className="font-mono">{done}</strong>/{total} đã xong
        </p>
        <p className="text-[13px] font-semibold text-late">{lateCount} việc quá hạn chưa xong</p>
      </div>
    </section>
  );
}
