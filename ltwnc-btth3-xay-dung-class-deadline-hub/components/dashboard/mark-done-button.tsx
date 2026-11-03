'use client';

import { useActionState } from 'react';
import { toggleCompleteAction } from '@/lib/actions';

type MarkDoneState = { error?: string } | null;

/**
 * Nút lime "✓ Đánh dấu đã xong" của PriorityCard. Server Action tự làm mới /dashboard
 * (revalidatePath) nên thẻ ưu tiên và bảng việc cập nhật cùng lúc khi action xong.
 */
export function MarkDoneButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState<MarkDoneState>(async () => {
    const result = await toggleCompleteAction(id);
    return result.ok ? null : { error: result.error ?? 'Không thể đánh dấu, hãy thử lại.' };
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        aria-label={`Đánh dấu đã xong: ${title}`}
        className="mt-1 min-h-[46px] cursor-pointer self-start rounded-field bg-lime px-[18px] font-bold text-ink disabled:cursor-wait disabled:opacity-60"
      >
        ✓ Đánh dấu đã xong
      </button>
      {state?.error ? (
        <p role="alert" className="text-[13px] font-semibold text-[#ff8a80]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
