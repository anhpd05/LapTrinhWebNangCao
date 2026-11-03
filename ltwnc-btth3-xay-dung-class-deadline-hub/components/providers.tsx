'use client';

import { SessionProvider } from 'next-auth/react';
import { ProgressProvider } from '@/components/progress/progress-provider';
import { NavProgress } from '@/components/ui/nav-progress';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavProgress />
      <ProgressProvider>{children}</ProgressProvider>
    </SessionProvider>
  );
}
