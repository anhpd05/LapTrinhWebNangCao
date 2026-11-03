'use client';

import { useEffect, useState } from 'react';

/**
 * Thời điểm "bây giờ" an toàn với hydration.
 *
 * Lần render đầu trả về `renderedAt` (Date.now() lúc server render, truyền xuống từ
 * Server Component) nên HTML của server và lần render đầu ở client giống hệt nhau.
 * Sau khi mount mới chuyển sang `Date.now()` thật và cập nhật theo `intervalMs`.
 */
export function useNow(renderedAt: number, intervalMs = 60_000): number {
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
