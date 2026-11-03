'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { toggleCompleteAction } from '@/lib/actions';

// Tiến độ cá nhân được tải ở client để /deadlines và /deadlines/[id] vẫn là trang tĩnh (ISR):
// HTML dùng chung cho mọi người, còn "đã xong" của từng người lấy qua GET /api/me/progress.

type ProgressStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface ProgressContextValue {
  /** `authenticated` chỉ khi đã đăng nhập VÀ đã tải xong tiến độ. */
  status: ProgressStatus;
  completed: Set<string>;
  toggle: (id: string) => Promise<void>;
  /** Đồng bộ lại tập đã xong sau khi một nơi khác (dashboard) gọi action. */
  replace: (ids: string[]) => void;
}

const EMPTY = new Set<string>();

const ProgressContext = createContext<ProgressContextValue>({
  status: 'loading',
  completed: EMPTY,
  toggle: async () => {},
  replace: () => {},
});

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}

type Load = 'idle' | 'loading' | 'ready' | 'denied';

const progressBodySchema = z.object({ completedIds: z.array(z.string()) });

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus, data: session } = useSession();
  const userId = session?.user?.id;
  const [completed, setCompleted] = useState<Set<string>>(EMPTY);
  const [load, setLoad] = useState<Load>('idle');

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      setCompleted(EMPTY);
      setLoad('idle');
      return;
    }

    const controller = new AbortController();
    setLoad('loading');
    fetch('/api/me/progress', { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        const body = res.ok ? progressBodySchema.safeParse(await res.json()) : null;
        if (!body?.success) {
          setCompleted(EMPTY);
          setLoad('denied');
          return;
        }
        setCompleted(new Set(body.data.completedIds));
        setLoad('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoad('denied');
      });
    return () => controller.abort();
    // userId: đổi tài khoản thì tải lại tiến độ của tài khoản mới.
  }, [sessionStatus, userId]);

  const replace = useCallback((ids: string[]) => setCompleted(new Set(ids)), []);

  const toggle = useCallback(async (id: string) => {
    const flip = (prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    };
    setCompleted(flip); // cập nhật lạc quan: đổi giao diện ngay, chưa chờ server

    try {
      const result = await toggleCompleteAction(id);
      if (result.ok && result.completedIds) setCompleted(new Set(result.completedIds));
      else setCompleted(flip); // rollback: đảo lại đúng mục đã đổi
    } catch {
      setCompleted(flip);
    }
  }, []);

  const status: ProgressStatus =
    sessionStatus === 'unauthenticated' || load === 'denied'
      ? 'unauthenticated'
      : sessionStatus === 'authenticated' && load === 'ready'
        ? 'authenticated'
        : 'loading';

  const value = useMemo(() => ({ status, completed, toggle, replace }), [status, completed, toggle, replace]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
