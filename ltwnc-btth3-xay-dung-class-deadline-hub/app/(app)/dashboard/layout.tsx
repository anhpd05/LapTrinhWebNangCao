import { getCompletedIds, getDeadlines } from '@/lib/data';
import { formatToday } from '@/lib/format';
import { requirePermission } from '@/lib/session';

// Lớp thứ 3 của /dashboard: root -> (app) (sidebar) -> dashboard (band lời chào).
// SSR nên được phép dùng Date.now() ở server.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission('deadline:complete', '/dashboard');
  const [deadlines, completedIds] = await Promise.all([getDeadlines(), getCompletedIds(session.user.id)]);

  const done = new Set(completedIds);
  const openCount = deadlines.filter((d) => !done.has(d.id)).length;
  // Tên gọi = từ cuối của họ tên ("Nguyễn Văn An" -> "An").
  const callName = (session.user.name ?? '').trim().split(/\s+/).pop() ?? '';

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[13px] tracking-[0.08em] text-muted">{formatToday(Date.now())}</span>
        <h1 className="font-display text-[clamp(32px,6vw,46px)] font-extrabold leading-none tracking-[-0.03em]">
          Chào {callName}, còn {openCount} việc.
        </h1>
      </div>
      {children}
    </>
  );
}
