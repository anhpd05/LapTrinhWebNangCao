'use client';

import { useActionState, useState } from 'react';
import { deleteDeadlineAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/validation';
import { useAdminToast } from './admin-toast';

/**
 * Nút "Xoá" có bước xác nhận: bấm lần 1 chỉ hiện "Xoá vĩnh viễn?", bấm "Xoá" lần 2 mới gửi
 * `<form action={deleteDeadlineAction}>`. Kết quả thành công hiện ở toast của trang (dòng này
 * sẽ biến mất khỏi bảng ngay sau khi trang làm mới, nên toast không nằm ở đây).
 */
export function DeleteButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const showToast = useAdminToast();

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await deleteDeadlineAction(prev, formData);
      if (result.ok && result.message) showToast(result.message);
      else setConfirming(false);
      return result;
    },
    null,
  );

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Xoá ${title}`}
          className="min-h-10 cursor-pointer rounded-[10px] border border-[#f0c4be] bg-card px-3.5 text-sm font-semibold text-late"
        >
          Xoá
        </button>
        {state && !state.ok ? (
          <span role="alert" className="text-xs font-semibold text-late">
            {state.error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm font-bold text-[#8c1d15]">Xoá vĩnh viễn?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="min-h-10 cursor-pointer rounded-[10px] border border-[#d5d9e0] bg-card px-3 text-sm font-semibold disabled:opacity-60"
      >
        Huỷ
      </button>
      <button
        type="submit"
        disabled={pending}
        aria-label={`Xác nhận xoá ${title}`}
        className="min-h-10 cursor-pointer rounded-[10px] bg-late px-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Đang xoá…' : 'Xoá'}
      </button>
    </form>
  );
}
