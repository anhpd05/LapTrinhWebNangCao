/**
 * Chỉ cho phép chuyển hướng tới đường dẫn nội bộ, chống open redirect.
 * Hàm thuần, dùng chung cho server và client.
 *
 * Từ chối (trả `fallback`):
 * - không bắt đầu bằng `/` (vd `https://evil.com`) hoặc bắt đầu bằng `//`;
 * - chứa `\` (trình duyệt coi `/\evil.com` là `//evil.com`);
 * - chứa ký tự điều khiển (trình duyệt bỏ tab/xuống dòng nên `/<tab>/evil.com` cũng thành `//evil.com`);
 * - trỏ lại `/login` hoặc `/api/auth` (tránh vòng lặp chuyển hướng sau khi đăng nhập).
 */
export function safeCallback(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('\\') || /[\u0000-\u001f\u007f]/.test(raw)) return fallback;

  const pathname = raw.split(/[?#]/, 1)[0];
  const looping = ['/login', '/api/auth'].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return looping ? fallback : raw;
}
