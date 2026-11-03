import type { Metadata } from 'next';
import { DeadlineCounters, DeadlineExplorer } from '@/components/deadline/deadline-explorer';
import { DarkBand } from '@/components/layout/dark-band';
import { HeaderBand } from '@/components/layout/header-band';
import { getDeadlines, getSubjects } from '@/lib/data';

// ISR: trang được dựng lại nền tối đa mỗi 60 giây.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Tất cả deadline',
  description: 'Danh sách mọi deadline của lớp, lọc theo môn và trạng thái.',
  alternates: { canonical: '/deadlines' },
};

export default async function DeadlinesPage() {
  const [deadlines, subjects] = await Promise.all([getDeadlines(), getSubjects()]);
  // Giờ server lúc dựng trang; mọi island client dùng nó cho lần render đầu (xem hooks/use-now.ts).
  const renderedAt = Date.now();

  return (
    <>
      <HeaderBand />
      <main id="main">
        <DarkBand>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-5 px-6 pb-9 pt-5">
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[13px] tracking-[0.08em] text-muted-dark">TỰ LÀM MỚI SAU 60 GIÂY</span>
            <h1 className="m-0 font-display text-[clamp(40px,8vw,60px)] font-extrabold leading-none tracking-[-0.03em]">
              Tất cả deadline
            </h1>
          </div>
          <DeadlineCounters deadlines={deadlines} renderedAt={renderedAt} />
        </div>
      </DarkBand>
      <DeadlineExplorer deadlines={deadlines} subjects={subjects} renderedAt={renderedAt} />
      </main>
    </>
  );
}
