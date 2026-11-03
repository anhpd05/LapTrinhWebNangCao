'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'running' | 'done';

/**
 * Thanh tiến trình lime ở mép trên: chạy ngay khi bấm link nội bộ, chạy nốt tới 100% rồi mờ đi khi
 * đường dẫn đổi. Cho cảm giác phản hồi tức thì dù trang đích cần SSR (dashboard, admin).
 * Chỉ là hiệu ứng nhìn: aria-hidden, và bị tắt bởi prefers-reduced-motion trong globals.css.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const [key, setKey] = useState(0);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  // Đường dẫn đã đổi: trang mới đã sẵn sàng. Chạy nốt rồi gỡ bar sau khi animation xong.
  useEffect(() => {
    if (phaseRef.current !== 'running') return;
    setPhase('done');
    const timer = window.setTimeout(() => setPhase('idle'), 450);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Cùng trang (chỉ khác hash) thì không có gì để chờ.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setKey((k) => k + 1);
      setPhase('running');
    }
    // Pha capture: <Link> của Next gọi preventDefault() ở pha bubble, nên nghe ở pha bubble sẽ luôn
    // thấy defaultPrevented = true.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (phase === 'idle') return null;
  return <div key={key} aria-hidden="true" className="nav-progress" data-phase={phase} />;
}
