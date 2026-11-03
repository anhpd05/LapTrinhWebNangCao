'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { can, roleOf } from '@/lib/permissions';

interface NavItem {
  href: string;
  label: string;
  /** Mục được tô sáng khi đường dẫn hiện tại khớp. */
  isCurrent: (pathname: string) => boolean;
}

const under = (base: string) => (pathname: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

const PUBLIC_ITEMS: NavItem[] = [
  { href: '/', label: 'Tổng quan', isCurrent: (p) => p === '/' },
  { href: '/deadlines', label: 'Deadline', isCurrent: under('/deadlines') },
  { href: '/subjects/lap-trinh-web', label: 'Môn học', isCurrent: under('/subjects') },
];

const MY_WORK: NavItem = { href: '/dashboard', label: 'Việc của tôi', isCurrent: under('/dashboard') };
const ADMIN: NavItem = { href: '/admin', label: 'Quản trị', isCurrent: under('/admin') };

export function PublicNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = roleOf(session);

  const items = [...PUBLIC_ITEMS];
  if (role !== 'guest') items.push(MY_WORK);
  if (can(role, 'deadline:create')) items.push(ADMIN);

  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto whitespace-nowrap"
    >
      {items.map((item) => {
        const current = item.isCurrent(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold hover:text-white ${
              current ? 'text-white' : 'text-muted-dark'
            }`}
          >
            {current && <span aria-hidden="true" className="size-1.5 rounded-pill bg-lime" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
