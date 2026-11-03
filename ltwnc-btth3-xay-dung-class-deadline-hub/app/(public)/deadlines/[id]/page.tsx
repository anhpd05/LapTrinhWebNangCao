import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/deadline/breadcrumb';
import { SameSubjectList } from '@/components/deadline/same-subject-list';
import { SharePreview } from '@/components/deadline/share-preview';
import { DarkBand } from '@/components/layout/dark-band';
import { HeaderBand } from '@/components/layout/header-band';
import { MyStatusCard } from '@/components/progress/my-status-card';
import { CountdownRing } from '@/components/time/countdown-ring';
import { getDeadline, getDeadlines, getDeadlinesBySubject, getSubjectByCode } from '@/lib/data';
import { formatDue } from '@/lib/format';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';

// ISR theo yêu cầu: id có sẵn được dựng lúc build, id mới (admin thêm) dựng ở lần truy cập đầu.
// Server Action gọi revalidatePath khi thêm/xoá; `revalidate` là lưới an toàn nếu có gì sót.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const deadlines = await getDeadlines();
  return deadlines.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deadline = await getDeadline(id);
  if (!deadline) return { title: 'Không tìm thấy' };
  const subject = await getSubjectByCode(deadline.subjectCode);
  const summary = deadline.description.length > 110 ? `${deadline.description.slice(0, 109)}…` : deadline.description;
  const description = `${subject?.name ?? deadline.subjectCode} · Hạn ${formatDue(deadline.dueAt)} · ${summary}`;
  const path = `/deadlines/${deadline.id}`;
  // Ảnh là route handler cố định `${path}/opengraph-image` (metadataBase biến thành URL tuyệt đối).
  // openGraph ở đây thay thế hẳn openGraph của layout nên nhắc lại locale/siteName.
  const image = `${path}/opengraph-image`;
  return {
    title: deadline.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: deadline.title,
      description,
      locale: 'vi_VN',
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: 'Ảnh chia sẻ deadline – Class Deadline Hub' }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function DeadlineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deadline = await getDeadline(id);
  if (!deadline) notFound();

  const subject = await getSubjectByCode(deadline.subjectCode);
  if (!subject) notFound();

  const sameSubject = (await getDeadlinesBySubject(deadline.subjectCode))
    .filter((d) => d.id !== deadline.id)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const renderedAt = Date.now();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Deadline', item: absoluteUrl('/deadlines') },
            { '@type': 'ListItem', position: 3, name: deadline.title, item: absoluteUrl(`/deadlines/${deadline.id}`) },
          ],
        }}
      />
      <HeaderBand />
      <main id="main">
      <DarkBand>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-9 px-6 pb-12 pt-4">
          <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-5">
            <Breadcrumb
              items={[{ label: 'Trang chủ', href: '/' }, { label: 'Deadline', href: '/deadlines' }, { label: `#${deadline.id}` }]}
            />
            <Link
              href={`/subjects/${subject.slug}`}
              className="relative self-start rounded-pill px-3.5 py-2 font-mono text-[13px] font-bold text-ink hover:text-ink after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']"
              style={{ background: subject.color.c }}
            >
              {subject.code} · {subject.name}
            </Link>
            <h1 className="font-display text-[clamp(34px,6vw,64px)] font-extrabold leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">
              {deadline.title}
            </h1>
            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] border-y border-line-dark">
              <div className="flex flex-col gap-1 py-3.5 pr-3.5">
                <dt className="text-xs tracking-[0.06em] text-[#8f98a8]">HẠN NỘP</dt>
                <dd className="m-0 font-mono font-bold">{formatDue(deadline.dueAt)}</dd>
              </div>
              <div className="flex flex-col gap-1 border-line-dark p-3.5 sm:border-l">
                <dt className="text-xs tracking-[0.06em] text-[#8f98a8]">NỘP QUA</dt>
                <dd className="m-0 font-semibold">{deadline.submitVia}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-[1_1_300px] justify-center">
            <CountdownRing dueAt={deadline.dueAt} renderedAt={renderedAt} />
          </div>
        </div>
      </DarkBand>

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-6 px-6 pb-[72px] pt-8">
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-panel border border-line bg-card p-[26px]">
            <h2 className="font-display text-2xl font-bold">Mô tả</h2>
            <p className="max-w-[68ch] text-[17px] leading-[1.75] text-[#2b303b]">{deadline.description}</p>
          </section>
          <SameSubjectList subjectName={subject.name} deadlines={sameSubject} renderedAt={renderedAt} />
        </article>
        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <MyStatusCard id={deadline.id} title={deadline.title} />
          <SharePreview id={deadline.id} title={deadline.title} />
        </aside>
      </div>
      </main>
    </>
  );
}
