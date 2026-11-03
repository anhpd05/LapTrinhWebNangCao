import type { Metadata } from 'next';
import { DarkBand } from '@/components/layout/dark-band';
import { PublicHeader } from '@/components/layout/public-header';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Trang tạm cho phase 2 (đích mặc định sau khi đăng nhập). Phase 4 thay bằng dashboard thật.
export default function DashboardPlaceholderPage() {
  return (
    <DarkBand>
      <PublicHeader />
      <h1 className="mx-auto max-w-[1280px] px-6 py-10 font-display text-4xl font-extrabold">Việc của tôi (tạm)</h1>
    </DarkBand>
  );
}
