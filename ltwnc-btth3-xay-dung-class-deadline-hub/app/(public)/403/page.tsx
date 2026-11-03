import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Không có quyền truy cập',
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-slate-400">403</p>
      <h1 className="mt-4 text-2xl font-bold">Bạn không có quyền truy cập</h1>
      <p className="mt-2 text-slate-600">Trang này chỉ dành cho tài khoản có quyền phù hợp.</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/" className="text-blue-600 underline">
          Về trang chủ
        </Link>
        <Link href="/dashboard" className="text-blue-600 underline">
          Về dashboard
        </Link>
      </div>
    </div>
  );
}
