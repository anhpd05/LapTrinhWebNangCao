export type Role = 'admin' | 'user';

export type DeadlineType = 'bai-tap' | 'kiem-tra' | 'do-an';

export interface Subject {
  slug: string;
  name: string;
  code: string;
  description: string;
  color: string;
}

export interface Deadline {
  id: string;
  title: string;
  subjectSlug: string;
  /** ISO 8601 kèm múi giờ, ví dụ `2026-11-20T23:59:00+07:00` */
  dueAt: string;
  description: string;
  type: DeadlineType;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}

/** userId -> danh sách id deadline đã hoàn thành */
export type Progress = Record<string, string[]>;
