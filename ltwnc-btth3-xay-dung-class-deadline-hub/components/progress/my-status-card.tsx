'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useProgress } from '@/components/progress/progress-provider';

const CARD = 'flex flex-col gap-3 rounded-panel border p-[22px]';
const BUTTON = 'min-h-[52px] rounded-[14px] px-4 text-base font-bold';

export function MyStatusCard({ id, title }: { id: string; title: string }) {
  const { status, completed, toggle } = useProgress();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();

  // Trang này là ISR dùng chung nên HTML ban đầu chưa biết ai đang xem: giữ chỗ cùng kích thước
  // thay vì chớp thẻ "chưa đăng nhập" với người đã đăng nhập.
  if (status === 'loading') {
    return (
      <section aria-busy="true" aria-label="Trạng thái của bạn" className={`${CARD} min-h-[190px] border-line bg-card`}>
        <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">TRẠNG THÁI CỦA BẠN</span>
      </section>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <section aria-label={`Trạng thái của bạn: ${title}`} className={`${CARD} border-line bg-card`}>
        <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">TRẠNG THÁI CỦA BẠN</span>
        <span className="font-display text-[26px] font-extrabold text-ink">Bạn chưa đăng nhập</span>
        <span className="text-sm text-muted">Đăng nhập để đánh dấu deadline này đã xong.</span>
        <Link
          href={`/login?callbackUrl=/deadlines/${id}`}
          className={`${BUTTON} flex items-center justify-center bg-ink text-white no-underline hover:text-white`}
        >
          Đăng nhập để đánh dấu
        </Link>
      </section>
    );
  }

  const done = completed.has(id);
  return (
    <section
      aria-label={`Trạng thái của bạn: ${title}`}
      className={`${CARD} ${done ? 'border-[#9FDBB9] bg-done-bg' : 'border-ink bg-ink'}`}
    >
      <span className={`font-mono text-xs font-bold tracking-[0.08em] ${done ? 'text-[#11663F]' : 'text-muted-dark'}`}>
        TRẠNG THÁI CỦA BẠN
      </span>
      <span className={`font-display text-[26px] font-extrabold ${done ? 'text-done' : 'text-white'}`}>
        {done ? 'Đã xong. Tuyệt!' : 'Chưa xong'}
      </span>
      <span className={`text-sm ${done ? 'text-[#11663F]' : 'text-muted-dark'}`}>
        {done
          ? 'Đã chuyển sang cột “Đã xong” trong Việc của tôi.'
          : `Lưu theo tài khoản ${session?.user?.email ?? ''}`.trim()}
      </span>
      <button
        type="button"
        aria-pressed={done}
        aria-disabled={pending || undefined}
        onClick={() => {
          if (!pending) startTransition(async () => toggle(id));
        }}
        className={`${BUTTON} cursor-pointer aria-disabled:cursor-wait ${
          done ? 'border border-[#9FDBB9] bg-white text-done' : 'border-0 bg-lime text-ink'
        }`}
      >
        {done ? 'Bỏ đánh dấu' : '✓ Đánh dấu đã xong'}
      </button>
    </section>
  );
}
