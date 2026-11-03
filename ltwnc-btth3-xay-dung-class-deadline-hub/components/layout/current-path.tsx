'use client';

import { usePathname } from 'next/navigation';

// Island nhỏ cho not-found: đọc đường dẫn ở client để không phải gọi headers() ở server.
export function CurrentPath() {
  const pathname = usePathname();
  return <span className="break-all font-mono text-[13px] tracking-[0.1em] text-muted-dark">{pathname}</span>;
}
