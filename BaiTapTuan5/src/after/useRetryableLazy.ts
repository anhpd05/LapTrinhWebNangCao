import { lazy, useCallback, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

export function useRetryableLazy<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>) {
  const [attempt, setAttempt] = useState(0);
  const lazyState = useMemo(() => ({ Component: lazy(factory), attempt }), [factory, attempt]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { ...lazyState, retry };
}
