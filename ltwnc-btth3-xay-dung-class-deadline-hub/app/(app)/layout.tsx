import type { Metadata } from 'next';
import { AppSidebarBody } from '@/components/layout/app-sidebar-body';
import { AppTopBar } from '@/components/layout/app-top-bar';
import { Logo } from '@/components/ui/logo';
import { getCompletedIds, getDeadlines } from '@/lib/data';
import { can } from '@/lib/permissions';
import { requirePermission } from '@/lib/session';

// Áp cho /dashboard và /admin: trang riêng tư không được index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// App shell: sidebar tối bên trái (≥1024px) hoặc thanh trên + drawer (<1024px).
// Đây là một lần đọc session để dựng sidebar, không phải lớp bảo vệ chính (đã có middleware
// và requirePermission trong từng page).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission('deadline:complete', '/dashboard');
  const [deadlines, completedIds] = await Promise.all([getDeadlines(), getCompletedIds(session.user.id)]);

  const done = new Set(completedIds);
  const openCount = deadlines.filter((d) => !done.has(d.id)).length;

  const sidebar = (
    <AppSidebarBody
      user={{
        name: session.user.name ?? '',
        initials: session.user.initials,
        studentId: session.user.studentId,
        role: session.user.role,
      }}
      openCount={openCount}
      totalCount={deadlines.length}
      showAdmin={can(session.user.role, 'deadline:create')}
    />
  );

  return (
    <div className="motion-app flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-[264px] flex-none flex-col gap-[26px] overflow-y-auto bg-ink px-4 py-[22px] text-[#f4f5f7] lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-2">
          <Logo />
        </div>
        {sidebar}
      </aside>
      <AppTopBar logo={<Logo />}>{sidebar}</AppTopBar>
      <main id="main" className="flex min-w-0 flex-1 flex-col gap-[22px] p-5 sm:p-8">{children}</main>
    </div>
  );
}
