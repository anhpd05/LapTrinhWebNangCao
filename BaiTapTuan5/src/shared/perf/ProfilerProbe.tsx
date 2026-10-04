import { Profiler, type ReactNode } from 'react';
import { perfAddCommit, type ProbeId } from './perf';

export interface ProfilerProbeProps {
  id: ProbeId;
  children: ReactNode;
}

/** Ở mode `profiling` bọc `<Profiler>` để đếm commit; mode khác trả nguyên `children`. */
export function ProfilerProbe({ id, children }: ProfilerProbeProps) {
  if (import.meta.env.MODE === 'profiling') {
    return (
      <Profiler id={id} onRender={(_id, _phase, actualDuration) => perfAddCommit(id, actualDuration)}>
        {children}
      </Profiler>
    );
  }
  return <>{children}</>;
}
