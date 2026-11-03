export default function DashboardLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-[22px]">
      <span role="status" className="sr-only">
        Đang tải việc của bạn…
      </span>
      <div className="flex flex-wrap gap-4">
        <div className="h-[200px] min-w-0 flex-[2_1_420px] animate-pulse rounded-[22px] bg-ink" />
        <div className="h-[176px] min-w-0 flex-[1_1_260px] animate-pulse rounded-[22px] border border-line bg-card" />
      </div>
      <div className="h-8 w-40 animate-pulse rounded-field bg-line" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-[18px] bg-ok-bg p-3 md:min-h-[380px]">
            <div className="h-6 w-1/2 animate-pulse rounded-pill bg-line" />
            {[0, 1].map((j) => (
              <div key={j} className="h-[84px] animate-pulse rounded-card border border-line bg-card" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
