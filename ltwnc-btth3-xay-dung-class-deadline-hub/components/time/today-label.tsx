'use client';

import { formatToday } from '@/lib/format';
import { useNow } from '@/hooks/use-now';

export function TodayLabel({ renderedAt }: { renderedAt: number }) {
  // Cập nhật mỗi phút để nhãn đổi đúng khi qua nửa đêm mà tab vẫn mở.
  const now = useNow(renderedAt, 60_000);
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-[13px] font-bold tracking-[0.1em] text-muted-dark">
      <span aria-hidden="true" className="size-2 rounded-full bg-lime ring-4 ring-lime/20" />
      HÔM NAY · {formatToday(now)}
    </span>
  );
}
