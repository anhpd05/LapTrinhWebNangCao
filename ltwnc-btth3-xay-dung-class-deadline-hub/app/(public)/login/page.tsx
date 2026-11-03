import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/login-form';
import { safeCallback } from '@/lib/safe-callback';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallback(rawCallback);

  if (await auth()) redirect(callbackUrl);

  return (
    <div className="mx-auto w-full max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-bold">Đăng nhập</h1>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
