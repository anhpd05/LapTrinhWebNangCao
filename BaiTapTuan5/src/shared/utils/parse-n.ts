export const DEFAULT_N = 10_000;
export const MAX_N = 50_000;

/**
 * Đọc `?n=` từ `location.search`.
 * Chỉ nhận số nguyên không âm; thiếu hoặc không hợp lệ thì trả `DEFAULT_N`; lớn hơn `MAX_N` thì kẹp về `MAX_N`.
 * `0` là hợp lệ.
 */
export function parseN(search: string): number {
  const raw = new URLSearchParams(search).get('n');
  if (raw === null || !/^\d+$/.test(raw)) return DEFAULT_N;
  return Math.min(Number(raw), MAX_N);
}
