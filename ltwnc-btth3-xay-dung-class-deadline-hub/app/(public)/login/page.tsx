import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';
import { GITHUB_LOGIN_ENABLED } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

// Trang tĩnh: không đọc searchParams ở server. callbackUrl do LoginForm đọc ở client
// bằng useSearchParams() trong <Suspense>.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="relative hidden flex-1 basis-[480px] flex-col justify-between overflow-hidden bg-ink px-12 pb-12 pt-8 text-[#f4f5f7] lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(#171B24 1px, transparent 1px), linear-gradient(90deg, #171B24 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative self-start">
          <Logo />
        </div>
        <div className="relative flex max-w-[520px] flex-col gap-3.5">
          <p className="font-display text-[56px] font-extrabold leading-[0.98] tracking-[-0.035em]">
            Xong bài nào,
            <br />
            <span className="text-lime">gạch bài đó.</span>
          </p>
          <p className="text-[17px] leading-relaxed text-[#c3c9d4]">
            Ai cũng xem được lịch chung. Đăng nhập để có bảng việc riêng.
          </p>
        </div>
      </section>

      <main id="main" className="flex flex-1 basis-[460px] items-center justify-center px-6 py-10">
        <Suspense fallback={<div aria-hidden="true" className="h-[480px] w-full max-w-[420px]" />}>
          <LoginForm githubEnabled={GITHUB_LOGIN_ENABLED} />
        </Suspense>
      </main>
    </div>
  );
}
