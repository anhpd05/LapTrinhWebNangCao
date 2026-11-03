const DEFAULT_CALLBACK = '/dashboard';

/**
 * Chỉ cho phép chuyển hướng tới đường dẫn nội bộ, chống open redirect.
 * Hàm thuần, dùng chung cho server (login page) và client (login form).
 *
 * Từ chối: không bắt đầu bằng `/`, bắt đầu bằng `//`, chứa `\` (trình duyệt
 * coi `/\evil.com` là `//evil.com`), hoặc chứa ký tự điều khiển (trình duyệt
 * bỏ tab/xuống dòng, nên `/<tab>/evil.com` cũng thành `//evil.com`).
 */
export function safeCallback(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return DEFAULT_CALLBACK;
  if (!raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_CALLBACK;
  if (raw.includes('\\') || /[\u0000-\u001f\u007f]/.test(raw)) return DEFAULT_CALLBACK;
  return raw;
}
