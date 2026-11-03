import type { Role } from './types';

export type ActorRole = Role | 'guest';

export type Action =
  | 'deadline:view'
  | 'deadline:complete'
  | 'deadline:create'
  | 'deadline:delete';

/**
 * Nơi DUY NHẤT định nghĩa ma trận quyền. Middleware, page và Server Action
 * đều phải hỏi qua `can()`, không tự đặt điều kiện quyền ở chỗ khác.
 */
const MATRIX: Record<Action, readonly ActorRole[]> = {
  'deadline:view': ['guest', 'user', 'admin'],
  'deadline:complete': ['user', 'admin'],
  'deadline:create': ['admin'],
  'deadline:delete': ['admin'],
};

export function can(role: ActorRole, action: Action): boolean {
  return MATRIX[action].includes(role);
}

export function roleOf(session: { user?: { role?: Role } } | null): ActorRole {
  return session?.user?.role ?? 'guest';
}
