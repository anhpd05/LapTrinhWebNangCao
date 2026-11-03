export default function AdminLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-[22px]">
      <span role="status" className="sr-only">
        Đang tải trang quản trị…
      </span>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-48 animate-pulse rounded-pill bg-line" />
        <div className="h-11 w-[min(420px,80%)] animate-pulse rounded-field bg-line" />
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <div className="h-[560px] min-w-0 flex-[3_1_420px] animate-pulse rounded-[22px] border border-line bg-card" />
        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-3.5">
          <div className="h-[210px] animate-pulse rounded-[22px] bg-ink" />
          <div className="h-[200px] animate-pulse rounded-[18px] border border-line bg-card" />
        </div>
      </div>
      <div className="h-[420px] animate-pulse rounded-[20px] border border-line bg-card" />
    </div>
  );
}
