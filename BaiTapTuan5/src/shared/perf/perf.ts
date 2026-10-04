export type CounterKey = 'rowRender' | 'generate' | 'filterSort';

export type ProbeId = 'App';

export interface CommitStat {
  commits: number;
  actualMs: number;
  maxMs: number;
}

export interface PerfStore {
  rowRender: number;
  generate: number;
  filterSort: number;
  App: CommitStat;
}

declare global {
  interface Window {
    __PERF__?: PerfStore;
    __PERF_RESET__?: () => void;
  }
}

// Mọi thao tác với `window.__PERF__` nằm trong nhánh `MODE === 'profiling'`.
// Bản production gấp hằng số này nên các hàm bên dưới rỗng và chuỗi bộ đếm bị loại khỏi bundle.

/** Đặt lại toàn bộ bộ đếm. Đây là chỗ duy nhất tạo store mới. */
export function perfReset(): void {
  if (import.meta.env.MODE === 'profiling') {
    window.__PERF__ = {
      rowRender: 0,
      generate: 0,
      filterSort: 0,
      App: { commits: 0, actualMs: 0, maxMs: 0 },
    };
  }
}

function getStore(): PerfStore | undefined {
  if (import.meta.env.MODE === 'profiling') {
    if (!window.__PERF__) {
      perfReset();
      window.__PERF_RESET__ = perfReset;
    }
    return window.__PERF__;
  }
  return undefined;
}

export function perfCount(key: CounterKey): void {
  if (import.meta.env.MODE === 'profiling') {
    const store = getStore();
    if (store) store[key] += 1;
  }
}

export function perfAddCommit(id: ProbeId, actualMs: number): void {
  if (import.meta.env.MODE === 'profiling') {
    const store = getStore();
    if (store) {
      const stat = store[id];
      stat.commits += 1;
      stat.actualMs += actualMs;
      stat.maxMs = Math.max(stat.maxMs, actualMs);
    }
  }
}

if (import.meta.env.MODE === 'profiling') {
  // Có `__PERF_RESET__` ngay khi module được nạp, trước mọi lần render.
  getStore();
}
