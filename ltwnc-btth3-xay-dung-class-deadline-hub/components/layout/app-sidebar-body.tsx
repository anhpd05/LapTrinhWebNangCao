import { Avatar } from '@/components/ui/avatar';
import type { Role } from '@/lib/types';
import { SidebarNav } from './sidebar-nav';
import { SignOutButton } from './sign-out-button';

// Nhãn vai trò hiển thị ở thẻ user (giống UserMenu; không import từ file 'use client' vì
// Server Component chỉ nhận được tham chiếu, không đọc được giá trị hằng số).
const ROLE_LABEL: Record<Role, string> = {
  admin: 'Lớp trưởng · admin',
  user: 'Sinh viên · user',
};

interface AppSidebarBodyProps {
  user: { name: string; initials: string; studentId: string; role: Role };
  openCount: number;
  totalCount: number;
  showAdmin: boolean;
}

/** Nội dung dưới logo của sidebar: menu + thẻ user. Dùng cho cả sidebar desktop và drawer mobile. */
export function AppSidebarBody({ user, openCount, totalCount, showAdmin }: AppSidebarBodyProps) {
  return (
    <>
      <SidebarNav openCount={openCount} totalCount={totalCount} showAdmin={showAdmin} />
      <div className="mt-auto flex flex-col gap-3 rounded-2xl border border-line-dark bg-ink-2 p-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar initials={user.initials} role={user.role} />
          <span className="flex min-w-0 flex-col leading-snug">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            <span
              className={`text-xs font-semibold ${user.role === 'admin' ? 'text-[#ffc266]' : 'text-muted-dark'}`}
            >
              {ROLE_LABEL[user.role]}
            </span>
            <span className="font-mono text-[11px] tracking-wide text-muted-dark">{user.studentId}</span>
          </span>
        </div>
        <SignOutButton />
      </div>
    </>
  );
}
