'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleCompleteAction } from '@/lib/actions';
import { useProgress } from '@/components/progress/progress-provider';

interface CompleteToggleProps {
  id: string;
  title: string;
  /**
   * Trạng thái do server render (dashboard). Khi có giá trị này, nó là nguồn sự thật trước khi
   * provider tải xong, và bấm sẽ dùng useOptimistic + toggleCompleteAction.
   */
  initialDone?: boolean;
}

export function CompleteToggle({ id, title, initialDone }: CompleteToggleProps) {
  if (initialDone !== undefined) return <ServerBackedToggle id={id} title={title} initialDone={initialDone} />;
  return <ProviderToggle id={id} title={title} />;
}

// Dùng trên /deadlines: đọc tiến độ từ ProgressProvider; khách và lúc đang tải thì không render gì
// nên HTML tĩnh (ISR) giống nhau cho mọi người.
function ProviderToggle({ id, title }: { id: string; title: string }) {
  const { status, completed, toggle } = useProgress();
  const [pending, startTransition] = useTransition();
  if (status !== 'authenticated') return null;

  return (
    <Box
      done={completed.has(id)}
      title={title}
      busy={pending}
      onClick={() => startTransition(async () => toggle(id))}
    />
  );
}

// Dùng trên /dashboard (SSR): server đã biết trạng thái nên hiện ngay, không chờ provider.
function ServerBackedToggle({ id, title, initialDone }: { id: string; title: string; initialDone: boolean }) {
  const { replace } = useProgress();
  const [done, setOptimisticDone] = useOptimistic(initialDone, (_current, next: boolean) => next);
  const [pending, startTransition] = useTransition();

  return (
    <Box
      done={done}
      title={title}
      busy={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimisticDone(!done);
          const result = await toggleCompleteAction(id);
          // Lỗi thì không đồng bộ gì: useOptimistic tự về lại giá trị server khi transition kết thúc.
          if (result.ok && result.completedIds) replace(result.completedIds);
        })
      }
    />
  );
}

function Box({
  done,
  title,
  busy,
  onClick,
}: {
  done: boolean;
  title: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={`Đánh dấu đã xong: ${title}`}
      aria-disabled={busy || undefined}
      onClick={() => {
        if (!busy) onClick();
      }}
      // Ô nhìn thấy 28px; ::after nới vùng bấm lên 44px mà không đổi giao diện.
      className={`relative flex size-7 flex-none cursor-pointer items-center justify-center rounded-lg border-2 p-0 after:absolute after:-inset-2 after:content-[''] aria-disabled:cursor-wait ${
        done ? 'border-ink bg-lime' : 'border-[#9AA3B2] bg-white'
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={done ? '#0B0D12' : '#FFFFFF'}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </button>
  );
}
