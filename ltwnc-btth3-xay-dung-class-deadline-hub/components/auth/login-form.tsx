'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { safeCallback } from '@/lib/safe-callback';

// Tài khoản demo do đề cho sẵn: chip chỉ điền vào form, không tự submit.
const DEMO_ACCOUNTS = [
  { label: 'sv@ptit.edu.vn · user', email: 'sv@ptit.edu.vn', password: 'sv123456' },
  { label: 'admin@ptit.edu.vn · admin', email: 'admin@ptit.edu.vn', password: 'admin123' },
];

const FIELD = 'min-h-[50px] rounded-card border border-[#c4c9d2] bg-card px-4 text-base';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const rawCallback = searchParams.get('callbackUrl');
  const callbackUrl = safeCallback(rawCallback);
  // Chỉ hiện thông báo khi callbackUrl hợp lệ (không bị safeCallback thay bằng mặc định).
  const hasCallback = rawCallback !== null && callbackUrl === rawCallback;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Đã đăng nhập mà vào /login thì chuyển thẳng tới nơi cần đến.
  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const res = await signIn('credentials', { email, password, redirect: false });
    if (!res || res.error) {
      setError('Email hoặc mật khẩu không đúng');
      setPending(false);
      return;
    }

    // Tải lại toàn trang (không chuyển trang kiểu client) để SessionProvider
    // đọc lại session mới, nếu không header vẫn hiện "Đăng nhập".
    window.location.assign(callbackUrl);
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-5">
      {hasCallback && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-card border border-line bg-card px-4 py-3.5 text-sm leading-normal"
        >
          <span
            aria-hidden="true"
            className="flex size-7 flex-none items-center justify-center rounded-lg bg-ink text-lime"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <span>
            Cần đăng nhập để tiếp tục. Xong sẽ đưa bạn quay lại{' '}
            <span className="font-mono font-bold">{callbackUrl}</span>.
          </span>
        </div>
      )}

      <h1 className="font-display text-[40px] font-extrabold tracking-[-0.02em]">Đăng nhập</h1>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">Điền nhanh tài khoản thử</span>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setError(null);
              }}
              className="min-h-10 cursor-pointer rounded-[10px] border border-[#c4c9d2] bg-card px-3 font-mono text-xs font-bold"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ten@ptit.edu.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${FIELD} font-normal`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm font-semibold">
            Mật khẩu
          </label>
          <div
            className={`flex items-center gap-2 rounded-card border bg-card py-1 pl-4 pr-1 ${
              error ? 'border-late' : 'border-[#c4c9d2]'
            }`}
          >
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
              className="min-h-[42px] min-w-0 flex-1 bg-transparent text-base outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="min-h-10 cursor-pointer rounded-[10px] bg-paper px-3 text-[13px] font-semibold"
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
          {error && (
            <span id="login-error" role="alert" className="text-[13px] font-semibold text-late">
              {error}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-[54px] cursor-pointer items-center justify-between rounded-card bg-lime px-5 text-[17px] font-extrabold text-ink disabled:opacity-60"
        >
          {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <Link href="/deadlines" className="self-start py-2 font-semibold">
        ← Xem deadline không cần đăng nhập
      </Link>
    </div>
  );
}
