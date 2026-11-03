import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeCta } from '@/components/home-cta';
import { SubjectCard } from '@/components/deadline/subject-card';
import { Timeline } from '@/components/deadline/timeline';
import { DarkBand } from '@/components/layout/dark-band';
import { HeaderBand } from '@/components/layout/header-band';
import { NearestDeadline } from '@/components/time/nearest-deadline';
import { TodayLabel } from '@/components/time/today-label';
import { getDeadlines, getSubjects } from '@/lib/data';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// SSG thuần: không export `revalidate`. Server Action ở phase 4 gọi revalidatePath('/')
// khi lớp trưởng thêm/xoá deadline. Mọi UI phụ thuộc giờ là client island nhận `renderedAt`.
export default async function HomePage() {
  const [subjects, deadlines] = await Promise.all([getSubjects(), getDeadlines()]);
  const renderedAt = Date.now();

  const slim = deadlines.map(({ id, title, subjectCode, dueAt }) => ({ id, title, subjectCode, dueAt }));

  return (
    <>
      <HeaderBand />
      <main id="main">
        <DarkBand>
          <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end gap-9 px-6 pt-8">
            <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-5">
              <TodayLabel renderedAt={renderedAt} />
              <h1 className="font-display text-[clamp(40px,8vw,76px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
                {deadlines.length} deadline.
                <br />
                {subjects.length} môn.
                <br />
                <span className="text-lime">Một dòng thời gian.</span>
              </h1>
              <p className="max-w-[520px] text-lg leading-relaxed text-[#C3C9D4]">
                Bấm vào từng mốc bên dưới để xem còn bao lâu. Đăng nhập để đánh dấu bài đã xong.
              </p>
            </div>
            <NearestDeadline deadlines={slim} subjects={subjects} renderedAt={renderedAt} />
          </div>
          <Timeline deadlines={deadlines} subjects={subjects} renderedAt={renderedAt} />
        </DarkBand>


      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-6 pb-[72px] pt-12">
        <section aria-labelledby="by-subject-heading" className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="by-subject-heading" className="font-display text-[34px] font-extrabold tracking-[-0.02em]">
              Theo môn học
            </h2>
            <Link href="/deadlines" className="py-[10px] font-semibold text-link hover:text-link-hover">
              Xem cả {deadlines.length} deadline →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.code}
                subject={subject}
                deadlines={slim.filter((d) => d.subjectCode === subject.code)}
                renderedAt={renderedAt}
              />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="flex flex-wrap items-center justify-between gap-5 rounded-panel bg-lime px-8 py-7"
        >
          <div className="flex max-w-[620px] flex-col gap-1.5">
            <h2 id="cta-heading" className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em]">
              Xong bài nào, gạch bài đó.
            </h2>
            <p className="text-base text-[#2B3110]">
              Đăng nhập để có bảng việc riêng và theo dõi tiến độ học kỳ.
            </p>
          </div>
          <HomeCta />
        </section>
      </div>
      </main>
    </>
  );
}
