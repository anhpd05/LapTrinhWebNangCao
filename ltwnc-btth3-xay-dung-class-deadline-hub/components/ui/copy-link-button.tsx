'use client';

import { useEffect, useRef, useState } from 'react';

// window.location.href chỉ đọc khi bấm nút, không đọc lúc render, nên HTML server và client khớp nhau.
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="min-h-[46px] cursor-pointer rounded-field border border-[#d5d9e0] bg-card px-4 font-semibold text-ink hover:bg-paper"
      >
        {copied ? 'Đã chép ✓' : 'Sao chép liên kết'}
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Đã sao chép liên kết' : ''}
      </span>
    </>
  );
}
