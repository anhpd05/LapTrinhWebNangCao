'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
  /** Màu chấm khi mục không được chọn. */
  dot: string;
  badge?: number;
  /** `/dashboard` khớp chính xác, `/admin` khớp theo prefix. */
  isCurrent: (pathname: string) => boolean;
}

const prefix = (base: string) => (pathname: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

function NavGroup({ heading, headingClass, items, pathname }: {
  heading: string;
  headingClass: string;
  items: NavLink[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className={`px-3 pb-1.5 pt-3 font-mono text-[11px] tracking-[0.1em] ${headingClass}`}>{heading}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const current = item.isCurrent(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`flex min-h-[46px] items-center gap-3 rounded-field px-3 text-[15px] ${
                  current
                    ? 'bg-lime font-bold text-ink hover:text-ink'
                    : 'font-medium text-[#c3c9d4] hover:bg-ink-2 hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2 flex-none rounded-[3px]"
                  style={{ backgroundColor: current ? '#0B0D12' : item.dot }}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined ? (
                  <span className="font-mono text-xs">{item.badge}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SidebarNav({
  openCount,
  totalCount,
  showAdmin,
}: {
  openCount: number;
  totalCount: number;
  showAdmin: boolean;
}) {
  const pathname = usePathname();

  const mine: NavLink[] = [
    { href: '/dashboard', label: 'Việc của tôi', dot: '#D4FF3A', badge: openCount, isCurrent: (p) => p === '/dashboard' },
    { href: '/deadlines', label: 'Tất cả deadline', dot: '#7AA2FF', isCurrent: prefix('/deadlines') },
    { href: '/', label: 'Dòng thời gian', dot: '#3DDBB0', isCurrent: (p) => p === '/' },
  ];
  const admin: NavLink[] = [
    { href: '/admin', label: 'Quản trị deadline', dot: '#FFC266', badge: totalCount, isCurrent: prefix('/admin') },
  ];

  return (
    <nav aria-label="Menu ứng dụng" className="flex flex-col gap-1">
      <NavGroup heading="CỦA TÔI" headingClass="text-[#8f98a8]" items={mine} pathname={pathname} />
      {showAdmin ? (
        <NavGroup heading="LỚP TRƯỞNG" headingClass="text-[#ffc266]" items={admin} pathname={pathname} />
      ) : null}
    </nav>
  );
}
