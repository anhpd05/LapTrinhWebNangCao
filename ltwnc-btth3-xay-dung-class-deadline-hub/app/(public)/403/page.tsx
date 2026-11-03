import type { Metadata } from 'next';
import Link from 'next/link';
import { SwitchAccountButton } from '@/components/auth/switch-account-button';
import { WhoAmI } from '@/components/auth/who-am-i';
import { DarkBand } from '@/components/layout/dark-band';
import { PublicHeader } from '@/components/layout/public-header';
import { PermissionTable } from '@/components/permission-table';

export const metadata: Metadata = {
  title: 'Không có quyền truy cập',
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <DarkBand>
      <PublicHeader />
      <main className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-10 px-6 pb-[72px] pt-14">
        <div className="flex flex-[999_1_460px] flex-col gap-4">
          <span className="self-start rounded-pill bg-[#2a2210] px-3 py-1.5 font-mono text-[13px] font-bold tracking-[0.08em] text-[#ffc266]">
            403 · KHU VỰC LỚP TRƯỞNG
          </span>
          <h1 className="font-display text-[clamp(40px,8vw,56px)] font-extrabold leading-none tracking-[-0.03em]">
            Bạn chưa có quyền vào đây.
          </h1>
          <p className="text-base leading-relaxed text-[#c3c9d4]">
            <WhoAmI /> Chỉ lớp trưởng mới thêm hoặc xoá được deadline.
          </p>
          <div className="flex flex-wrap gap-3 pt-1.5">
            <Link
              href="/dashboard"
              className="flex min-h-[52px] items-center rounded-card bg-lime px-[22px] font-extrabold text-ink hover:text-ink"
            >
              Về Việc của tôi
            </Link>
            <SwitchAccountButton />
          </div>
        </div>
        <PermissionTable />
      </main>
    </DarkBand>
  );
}
