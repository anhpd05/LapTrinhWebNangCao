import { auth } from '@/auth';
import { getCompletedIds } from '@/lib/data';
import { can, roleOf } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(roleOf(session), 'deadline:complete')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }
  const completedIds = await getCompletedIds(session.user.id);
  return Response.json({ completedIds }, { headers: NO_STORE });
}
