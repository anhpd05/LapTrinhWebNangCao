import type { MetadataRoute } from 'next';
import { getDeadlines, getSubjects } from '@/lib/data';
import { absoluteUrl } from '@/lib/site';

// Dựng lúc build; thêm/xoá deadline gọi revalidatePath('/sitemap.xml') nên cập nhật ngay.
// `revalidate` là lưới an toàn nếu có thao tác nào sót.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [deadlines, subjects] = await Promise.all([getDeadlines(), getSubjects()]);
  const now = new Date();

  return [
    { url: absoluteUrl('/'), lastModified: now },
    { url: absoluteUrl('/deadlines'), lastModified: now },
    ...subjects.map((s) => ({ url: absoluteUrl(`/subjects/${s.slug}`), lastModified: now })),
    ...deadlines.map((d) => ({
      url: absoluteUrl(`/deadlines/${d.id}`),
      lastModified: new Date(d.createdAt),
    })),
  ];
}
