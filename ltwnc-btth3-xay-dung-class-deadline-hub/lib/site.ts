// Gốc URL tuyệt đối của site (metadata, sitemap, robots, JSON-LD). Đặt SITE_URL khi build/chạy trên server thật.
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const SITE_NAME = 'Class Deadline Hub';

/** `absoluteUrl('/deadlines/1')` -> `https://domain/deadlines/1` */
export function absoluteUrl(path = '/'): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, `${SITE_URL}/`).toString();
}

/**
 * Đăng nhập GitHub chỉ bật khi server có OAuth App (AUTH_GITHUB_ID + AUTH_GITHUB_SECRET). Thiếu thì
 * không đăng ký provider và trang /login không hiện nút, thay vì hiện một nút bấm vào là lỗi.
 * /login là trang tĩnh nên giá trị được chốt lúc build: đổi biến môi trường thì phải build lại.
 */
export const GITHUB_LOGIN_ENABLED = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
