import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-display text-xl font-extrabold text-[#f4f5f7] hover:text-[#f4f5f7]"
    >
      <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-lime">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0B0D12"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M9 2h6" />
        </svg>
      </span>
      Deadline Hub
    </Link>
  );
}
