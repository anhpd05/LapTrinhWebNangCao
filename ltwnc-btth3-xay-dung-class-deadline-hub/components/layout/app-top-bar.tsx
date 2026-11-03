'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Thanh trên cùng dưới 1024px: logo + nút mở drawer. `logo` và `children` (nội dung sidebar)
 * là Server Component truyền vào, nên component này chỉ giữ state mở/đóng.
 */
export function AppTopBar({ logo, children }: { logo: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  // Đổi trang thì đóng drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        openerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-[#f4f5f7] lg:hidden">
      {logo}
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="app-drawer"
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[#2a303c] px-3.5 text-sm font-semibold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>

      {open ? (
        <div className="fixed inset-0 z-40">
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/60"
          />
          <div
            id="app-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu ứng dụng"
            className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col gap-6 overflow-y-auto bg-ink px-4 py-5"
          >
            <div className="flex items-center justify-between gap-3">
              {logo}
              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  openerRef.current?.focus();
                }}
                aria-label="Đóng menu"
                className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] border border-[#2a303c] text-lg"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </header>
  );
}
