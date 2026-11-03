'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const navRef = useRef<HTMLElement>(null);
  // Còn nội dung bị cắt ở mép phải: hiện dải mờ để gợi ý có thể cuộn ngang.
  const [moreRight, setMoreRight] = useState(false);

  const items = [...PUBLIC_ITEMS];
  if (role !== 'guest') items.push(MY_WORK);
  if (can(role, 'deadline:create')) items.push(ADMIN);

  const update = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, items.length]);

  return (
    <div className="relative min-w-0 max-sm:order-3 max-sm:basis-full sm:flex-1">
      <nav
        ref={navRef}
        onScroll={update}
        aria-label="Điều hướng chính"
        className="-m-1.5 flex min-w-0 gap-0.5 overflow-x-auto whitespace-nowrap p-1.5"
      >
        {items.map((item) => {
          const current = item.isCurrent(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold hover:text-white max-sm:px-2.5 max-sm:text-sm ${
                current ? 'text-white' : 'text-muted-dark'
              }`}
            >
              {current && <span aria-hidden="true" className="size-1.5 rounded-pill bg-lime" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 -right-1.5 w-10 bg-gradient-to-r from-transparent to-ink transition-opacity ${
          moreRight ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
