import { DarkBand } from '@/components/layout/dark-band';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-line bg-card px-[18px] py-3.5">
      <div className="size-[60px] flex-none animate-pulse rounded-card bg-line" />
      <div className="flex min-w-0 flex-auto flex-col gap-2.5">
        <div className="h-[22px] w-3/4 animate-pulse rounded bg-line" />
        <div className="h-[18px] w-1/2 animate-pulse rounded bg-line" />
      </div>
      <div className="hidden h-7 w-24 animate-pulse rounded-pill bg-line sm:block" />
    </div>
  );
}

export default function DeadlinesLoading() {
  return (
    <main id="main" aria-busy="true">
      <span className="sr-only">Đang tải danh sách deadline…</span>
      <DarkBand>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-5 px-6 pb-9 pt-[88px]">
          <div className="flex flex-col gap-2.5">
            <div className="h-4 w-52 animate-pulse rounded bg-line-dark" />
            <div className="h-[60px] w-[min(420px,80vw)] animate-pulse rounded bg-line-dark" />
          </div>
          <div className="flex gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] w-[100px] animate-pulse rounded-card bg-ink-2" />
            ))}
          </div>
        </div>
      </DarkBand>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-7 px-6 pb-[72px] pt-7">
        <div className="h-[420px] min-w-0 flex-[1_1_260px] animate-pulse rounded-panel border border-line bg-card" />
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
