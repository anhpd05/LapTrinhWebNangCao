import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeCta, HomeCtaText } from '@/components/home-cta';
import { SubjectCard } from '@/components/deadline/subject-card';
import { Timeline } from '@/components/deadline/timeline';
import { DarkBand } from '@/components/layout/dark-band';
import { HeaderBand } from '@/components/layout/header-band';
import { NearestDeadline } from '@/components/time/nearest-deadline';
import { TodayLabel } from '@/components/time/today-label';
import { getDeadlines, getSubjects } from '@/lib/data';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';

// Không khai báo `openGraph` ở đây: Next gộp nông nên sẽ làm mất og:image chung từ app/opengraph-image.tsx.
export const metadata: Metadata = { alternates: { canonical: '/' } };

// Chú thích màu vạch trên thẻ môn (khớp SEGMENT_COLOR trong components/time/next-up.tsx).
const SEGMENT_LEGEND = [
  { label: 'Quá hạn', className: 'bg-[#E0453A]' },
  { label: 'Còn ≤ 3 ngày', className: 'bg-[#F2A33A]' },
  { label: 'Còn xa', className: 'bg-[#C9CED8]' },
];

// SSG thuần: không export `revalidate`. Server Action ở phase 4 gọi revalidatePath('/')
// khi lớp trưởng thêm/xoá deadline. Mọi UI phụ thuộc giờ là client island nhận `renderedAt`.
export default async function HomePage() {
  const [subjects, deadlines] = await Promise.all([getSubjects(), getDeadlines()]);
  const renderedAt = Date.now();

  const slim = deadlines.map(({ id, title, subjectCode, dueAt }) => ({ id, title, subjectCode, dueAt }));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: absoluteUrl('/'),
          inLanguage: 'vi',
          description: 'Cổng theo dõi deadline các môn học của lớp.',
        }}
      />
      <HeaderBand />
      <main id="main">
        <DarkBand>
          <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end gap-9 px-6 pt-10">
            <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-5">
              <TodayLabel renderedAt={renderedAt} />
              <h1 className="font-display text-[clamp(40px,8vw,76px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
                <span className="hero-line">{deadlines.length} deadline.</span>
                <span className="hero-line">{subjects.length} môn.</span>
                <span className="hero-line text-lime">Một dòng thời gian.</span>
              </h1>
              <p className="max-w-[520px] text-lg leading-relaxed text-on-dark-soft">
                Mỗi mốc là một bài cần nộp, bấm vào để xem còn bao lâu. Đăng nhập để đánh dấu bài đã xong.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#timeline-heading"
                  className="inline-flex min-h-12 flex-[1_1_200px] items-center justify-center gap-2 rounded-field bg-lime px-5 font-bold text-ink hover:text-ink sm:flex-none"
                >
                  Xem dòng thời gian
                  <span aria-hidden="true" className="arrow-nudge rotate-90">→</span>
                </a>
                <Link
                  href="/deadlines"
                  className="inline-flex min-h-12 flex-[1_1_200px] items-center justify-center gap-2 rounded-field border border-line-dark px-5 font-bold text-on-dark hover:border-[#3a4150] hover:bg-ink-2 hover:text-on-dark sm:flex-none"
                >
                  Tất cả deadline
                  <span aria-hidden="true" className="arrow-nudge">→</span>
                </Link>
              </div>
            </div>
            <NearestDeadline deadlines={slim} subjects={subjects} renderedAt={renderedAt} />
          </div>
          <Timeline deadlines={deadlines} subjects={subjects} renderedAt={renderedAt} />
        </DarkBand>

        <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6 pb-[88px] pt-14">
          <section aria-labelledby="by-subject-heading" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 id="by-subject-heading" className="font-display text-[34px] font-extrabold tracking-[-0.02em]">
                  Theo môn học
                </h2>
                <ul aria-label="Chú thích màu vạch" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                  {SEGMENT_LEGEND.map((s) => (
                    <li key={s.label} className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className={`h-1.5 w-4 rounded-pill ${s.className}`} />
                      {s.label}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/deadlines" className="inline-flex items-center gap-1.5 py-[10px] font-semibold text-link hover:text-link-hover">
                Xem cả {deadlines.length} deadline
                <span aria-hidden="true" className="arrow-nudge">→</span>
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
            className="reveal relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-panel bg-lime px-8 py-8"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute -right-6 -top-10 size-48 text-ink/[0.07]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            <div className="relative flex max-w-[620px] flex-col gap-1.5">
              <h2 id="cta-heading" className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                Xong bài nào, gạch bài đó.
              </h2>
              <HomeCtaText />
            </div>
            <HomeCta />
          </section>
        </div>
      </main>
    </>
  );
}
