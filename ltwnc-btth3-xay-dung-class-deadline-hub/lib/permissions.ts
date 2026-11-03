import type { Role } from './types';

export type ActorRole = Role | 'guest';

export type Action =
  | 'deadline:view'
  | 'deadline:complete'
  | 'deadline:create'
  | 'deadline:delete';

/**
 * Nơi DUY NHẤT định nghĩa ma trận quyền. Middleware, page và Server Action
 * đều phải hỏi qua `can()`; bảng ở trang 403 cũng được sinh từ đây.
 */
export const PERMISSIONS: Record<Action, readonly ActorRole[]> = {
  'deadline:view': ['guest', 'user', 'admin'],
  'deadline:complete': ['user', 'admin'],
  'deadline:create': ['admin'],
  'deadline:delete': ['admin'],
};

export function can(role: ActorRole, action: Action): boolean {
  return PERMISSIONS[action].includes(role);
}

export function roleOf(session: { user?: { role?: Role } } | null): ActorRole {
  return session?.user?.role ?? 'guest';
}

export const ACTION_LABELS: Record<Action, string> = {
  'deadline:view': 'Xem deadline',
  'deadline:complete': 'Đánh dấu đã xong',
  'deadline:create': 'Thêm deadline',
  'deadline:delete': 'Xoá deadline',
};
