'use client';

import { useEffect, useRef } from 'react';

const AUTO_HIDE_MS = 4_000;

/**
 * Toast đen có dấu ✓. Vùng `role="status"` luôn có mặt trong DOM để trình đọc màn hình
 * đọc được nội dung mới; `message = null` thì ẩn pill. Tự đóng sau ~4 giây.
 */
export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  // Giữ onClose mới nhất trong ref để đổi hàm cha không làm timer chạy lại từ đầu.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onCloseRef.current(), AUTO_HIDE_MS);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {message ? (
        <div className="pointer-events-auto flex max-w-[560px] items-start gap-3 rounded-card bg-ink px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(11,13,18,0.35)]">
          <span
            aria-hidden="true"
            className="mt-px flex size-5 flex-none items-center justify-center rounded-pill bg-lime text-xs font-extrabold text-ink"
          >
            ✓
          </span>
          <span className="min-w-0 flex-1 leading-snug">{message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo"
            className="-my-1 -mr-1 flex size-7 flex-none cursor-pointer items-center justify-center rounded-lg text-muted-dark hover:text-white"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
