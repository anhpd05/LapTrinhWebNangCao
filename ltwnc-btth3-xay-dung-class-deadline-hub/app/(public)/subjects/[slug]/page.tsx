import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DarkBand } from '@/components/layout/dark-band';
import { HeaderBand } from '@/components/layout/header-band';
import { SubjectDeadlineCards } from '@/components/time/subject-deadline-cards';
import { SubjectStats } from '@/components/time/subject-stats';
import { getDeadlinesBySubject, getSubjectBySlug, getSubjects } from '@/lib/data';

// SSG: 4 môn dựng lúc build; slug lạ vẫn trả 404 nhờ notFound() bên dưới.
// KHÔNG đặt dynamicParams = false: ở Next 15.5 route dynamicParams=false bị revalidatePath dựng
// lại thành trang 404 dù slug hợp lệ (gặp khi admin thêm/xoá deadline, kiểm chứng ở bản build thật).
export const dynamicParams = true;

export async function generateStaticParams() {
  const subjects = await getSubjects();
  return subjects.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return {};
  return { title: subject.name, description: subject.desc, alternates: { canonical: `/subjects/${subject.slug}` } };
}

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  const [subjects, deadlines] = await Promise.all([getSubjects(), getDeadlinesBySubject(subject.code)]);
  const renderedAt = Date.now();
  const sorted = [...deadlines].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));

  return (
    <>
      <HeaderBand />
      <main id="main">
      <DarkBand>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-6 select-none font-display text-[160px] font-extrabold leading-none tracking-[-0.06em] text-transparent opacity-55 md:-bottom-[70px] md:-right-10 md:text-[340px]"
          style={{ WebkitTextStroke: `2px ${subject.color.c}` }}
        >
          {subject.code}
        </span>
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-6 px-6 pb-11 pt-3">
          <nav aria-label="Chọn môn học" className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const current = s.slug === subject.slug;
              return (
                <Link
                  key={s.slug}
                  href={`/subjects/${s.slug}`}
                  aria-current={current ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center gap-2.5 rounded-pill border px-4 text-[15px] font-semibold ${
                    current
                      ? 'border-[#f4f5f7] bg-[#f4f5f7] text-ink hover:text-ink'
                      : 'border-[#2a303c] bg-transparent text-[#c3c9d4] hover:text-white'
                  }`}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: s.color.c }} />
                  {s.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex max-w-[760px] flex-col gap-3">
            <span
              className="font-mono text-[13px] tracking-[0.1em]"
              style={{ color: subject.color.c }}
            >
              MÔN HỌC · {subject.code}
            </span>
            <h1 className="font-display text-[clamp(40px,9vw,76px)] font-extrabold leading-[0.95] tracking-[-0.04em]">
              {subject.name}
            </h1>
            <p className="text-[17px] leading-relaxed text-[#c3c9d4]">
              {subject.desc} · Giảng viên: {subject.lecturer}
            </p>
          </div>
          <SubjectStats
            dueDates={sorted.map((d) => d.dueAt)}
            color={subject.color.c}
            renderedAt={renderedAt}
          />
        </div>
      </DarkBand>

      <div className="mx-auto flex max-w-[1280px] flex-col gap-[18px] px-6 pb-[72px] pt-9">
        <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em]">Deadline của môn</h2>
        {sorted.length === 0 ? (
          <p className="text-base text-muted">Môn này hiện chưa có deadline.</p>
        ) : (
          <SubjectDeadlineCards
            deadlines={sorted.map((d) => ({ id: d.id, title: d.title, dueAt: d.dueAt }))}
            renderedAt={renderedAt}
          />
        )}
      </div>
      </main>
    </>
  );
}
