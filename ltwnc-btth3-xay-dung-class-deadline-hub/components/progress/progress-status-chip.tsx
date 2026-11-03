'use client';

import { useProgress } from '@/components/progress/progress-provider';
import { StatusChip } from '@/components/time/status-chip';

interface ProgressStatusChipProps {
  id: string;
  dueAt: string;
  renderedAt: number;
}

// StatusChip biết tiến độ cá nhân: khách / lúc đang tải render y như StatusChip thường (khớp HTML
// của server); đăng nhập và đã tải xong tiến độ thì deadline đã tick hiện "Đã xong" như trên /deadlines.
export function ProgressStatusChip({ id, dueAt, renderedAt }: ProgressStatusChipProps) {
  const progress = useProgress();
  const done = progress.status === 'authenticated' && progress.completed.has(id);
  return <StatusChip dueAt={dueAt} renderedAt={renderedAt} done={done} />;
}
