import type { Subject } from '@/lib/types';

interface SubjectTagProps {
  subject: Pick<Subject, 'code' | 'name' | 'color'>;
  /** Dùng trên nền tối: nền là màu chấm của môn, chữ đen. */
  dark?: boolean;
  /** Thêm tên môn sau mã môn: "WEB · Lập trình Web". */
  showName?: boolean;
}

export function SubjectTag({ subject, dark = false, showName = false }: SubjectTagProps) {
  const { code, name, color } = subject;
  return (
    <span
      className={
        dark
          ? 'inline-flex items-center gap-2 self-start rounded-pill px-3.5 py-2 font-mono text-[13px] font-bold text-ink'
          : 'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-[3px] font-mono text-xs font-bold'
      }
      style={dark ? { backgroundColor: color.c } : { backgroundColor: color.bg, color: color.ink }}
    >
      <span
        aria-hidden="true"
        className="size-2 flex-none rounded-full"
        style={{ backgroundColor: dark ? '#0B0D12' : color.c }}
      />
      {showName ? `${code} · ${name}` : code}
    </span>
  );
}
