import { DarkBand } from '@/components/layout/dark-band';

export default function Loading() {
  return (
    <div className="min-h-screen bg-paper" role="status" aria-label="Đang tải">
      <DarkBand>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 pb-14 pt-[100px]">
          <div className="h-4 w-40 animate-pulse rounded-pill bg-line-dark" />
          <div className="h-14 w-full max-w-[560px] animate-pulse rounded-card bg-line-dark" />
          <div className="h-5 w-full max-w-[420px] animate-pulse rounded-pill bg-line-dark" />
        </div>
      </DarkBand>
      <div className="mx-auto grid max-w-[1280px] gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-[180px] animate-pulse flex-col gap-3 rounded-card border border-line bg-card p-5">
            <div className="h-5 w-16 rounded-pill bg-ok-bg" />
            <div className="h-6 w-3/4 rounded-field bg-ok-bg" />
            <div className="h-4 w-1/2 rounded-pill bg-ok-bg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
