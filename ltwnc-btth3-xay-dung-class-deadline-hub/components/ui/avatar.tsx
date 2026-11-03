import type { Role } from '@/lib/types';

// Màu nền avatar theo vai trò (lấy từ prototype).
const BG: Record<Role, string> = {
  admin: 'bg-[#ffc266]',
  user: 'bg-[#3ddbb0]',
};

export function Avatar({ initials, role }: { initials: string; role: Role }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[38px] shrink-0 items-center justify-center rounded-pill text-sm font-extrabold text-ink ${BG[role]}`}
    >
      {initials}
    </span>
  );
}
