'use client';

import { useSession } from 'next-auth/react';
import { ROLE_LABEL } from './user-menu';

export function WhoAmI() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span aria-hidden="true" className="inline-block h-6 w-64 animate-pulse rounded bg-line-dark align-middle" />;
  }
  if (!session) return <>Bạn chưa đăng nhập.</>;

  return (
    <>
      Bạn đang đăng nhập là{' '}
      <strong className="text-white">
        {session.user.name} ({session.user.studentId}) · {ROLE_LABEL[session.user.role]}
      </strong>
      .
    </>
  );
}
