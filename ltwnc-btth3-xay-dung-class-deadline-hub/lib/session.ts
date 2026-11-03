import 'server-only';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { can, roleOf, type Action } from '@/lib/permissions';

/**
 * Lớp kiểm tra thứ hai, độc lập với middleware: guest -> /login, thiếu quyền -> /403.
 * Trả về session đã chắc chắn có người dùng.
 */
export async function requirePermission(action: Action, callbackPath: string): Promise<Session> {
  const session = await auth();
  const role = roleOf(session);
  if (role === 'guest' || !session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent(callbackPath));
  }
  if (!can(role, action)) redirect('/403');
  return session;
}
