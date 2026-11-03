import { AdminToastProvider } from '@/components/admin/admin-toast';
import { CreateDeadlineForm } from '@/components/admin/create-deadline-form';
import { DeadlineTable } from '@/components/admin/deadline-table';
import { RevalidateLog } from '@/components/admin/revalidate-log';
import { getDeadlines, getSubjects } from '@/lib/data';
import { requirePermission } from '@/lib/session';

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DEFAULT_DUE_IN_DAYS = 14;

/** Ngày hạn mặc định: hôm nay + 14 ngày, theo lịch giờ VN, dạng YYYY-MM-DD. */
function defaultDueDate(now: number): string {
  return new Date(now + VN_OFFSET_MS + DEFAULT_DUE_IN_DAYS * DAY_MS).toISOString().slice(0, 10);
}

// SSR: chỉ lớp trưởng (admin) vào được. Middleware chặn trước, đây là lớp kiểm tra thứ hai.
export default async function AdminPage() {
  await requirePermission('deadline:create', '/admin');
  const [deadlines, subjects] = await Promise.all([getDeadlines(), getSubjects()]);
  const now = Date.now();

  return (
    <AdminToastProvider>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[13px] tracking-[0.08em] text-muted">
          QUẢN TRỊ · {deadlines.length} DEADLINE
        </span>
        <h1 className="font-display text-[clamp(32px,6vw,46px)] font-extrabold leading-none tracking-[-0.03em]">
          Thêm &amp; xoá deadline
        </h1>
      </div>
      <CreateDeadlineForm subjects={subjects} renderedAt={now} defaultDate={defaultDueDate(now)}>
        <RevalidateLog />
      </CreateDeadlineForm>
      <DeadlineTable deadlines={deadlines} subjects={subjects} />
    </AdminToastProvider>
  );
}
