// Gốc URL tuyệt đối của site (metadata, sitemap, robots, JSON-LD). Đặt SITE_URL khi build/chạy trên server thật.
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const SITE_NAME = 'Class Deadline Hub';

/** `absoluteUrl('/deadlines/1')` -> `https://domain/deadlines/1` */
export function absoluteUrl(path = '/'): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, `${SITE_URL}/`).toString();
}
