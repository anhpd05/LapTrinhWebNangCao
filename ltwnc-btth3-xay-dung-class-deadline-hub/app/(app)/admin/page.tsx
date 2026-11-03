import type { Metadata } from 'next';
import { DarkBand } from '@/components/layout/dark-band';
import { PublicHeader } from '@/components/layout/public-header';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Trang tạm cho phase 2 (kiểm tra middleware). Phase 4 thay bằng trang quản trị thật.
export default function AdminPlaceholderPage() {
  return (
    <DarkBand>
      <PublicHeader />
      <h1 className="mx-auto max-w-[1280px] px-6 py-10 font-display text-4xl font-extrabold">Quản trị (tạm)</h1>
    </DarkBand>
  );
}
