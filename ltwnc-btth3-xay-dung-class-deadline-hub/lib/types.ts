export type Role = 'admin' | 'user';

export type SubjectCode = 'WEB' | 'CSDL' | 'MMT' | 'TRR';

export interface SubjectColor {
  /** màu chấm / mốc */
  c: string;
  /** màu chữ nhãn môn */
  ink: string;
  /** màu nền tag môn */
  bg: string;
}

export interface Subject {
  code: SubjectCode;
  slug: string;
  name: string;
  desc: string;
  lecturer: string;
  color: SubjectColor;
}

export interface Deadline {
  id: string;
  title: string;
  subjectCode: SubjectCode;
  /** ISO 8601 kèm múi giờ, ví dụ `2026-11-20T23:59:00+07:00` */
  dueAt: string;
  description: string;
  submitVia: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  initials: string;
  /** Mã sinh viên, hiển thị ở thẻ người dùng */
  studentId: string;
  passwordHash: string;
  role: Role;
}

/** userId -> danh sách id deadline đã hoàn thành */
export type Progress = Record<string, string[]>;

export interface RevalidateLogEntry {
  /** ISO 8601 */
  at: string;
  text: string;
}
