'use client';

import { useEffect, useRef, useState } from 'react';

// window.location.href chỉ đọc khi bấm nút, không đọc lúc render, nên HTML server và client khớp nhau.
export function CopyLinkButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let next: 'copied' | 'failed' = 'copied';
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      next = 'failed';
    }
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="min-h-[46px] cursor-pointer rounded-field border border-[#d5d9e0] bg-card px-4 font-semibold text-ink hover:bg-paper"
      >
        {state === 'copied' ? 'Đã chép ✓' : state === 'failed' ? 'Không chép được, hãy copy từ thanh địa chỉ' : 'Sao chép liên kết'}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Đã sao chép liên kết' : state === 'failed' ? 'Không sao chép được liên kết' : ''}
      </span>
    </>
  );
}
