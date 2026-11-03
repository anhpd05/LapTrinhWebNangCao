/**
 * Tính khung dòng thời gian trang chủ: các tuần từ thứ Hai trước deadline sớm nhất
 * tới hết tuần của deadline muộn nhất. Hàm thuần, tính theo lịch giờ VN (UTC+7).
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const VN_OFFSET = 7 * HOUR;

const dayIndex = (ms: number) => Math.floor((ms + VN_OFFSET) / DAY);
/** Số thứ tự ngày của thứ Hai đầu tuần chứa ngày `i` (1970-01-01 là thứ Năm). */
const mondayOf = (i: number) => i - ((i + 3) % 7);
/** 00:00 giờ VN của ngày `i`, tính bằng ms. */
const startOfDay = (i: number) => i * DAY - VN_OFFSET;

const pad = (n: number) => String(n).padStart(2, '0');

/** "26.10" */
function dotLabel(i: number): string {
  const d = new Date(i * DAY);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`;
}

/** Số tuần theo ISO 8601 của tuần bắt đầu bằng thứ Hai `monday`. */
function isoWeek(monday: number): number {
  const thursday = monday + 3;
  const year = new Date(thursday * DAY).getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1) / DAY;
  return Math.floor((thursday - jan1) / 7) + 1;
}

export interface TimelineWeek {
  /** thứ tự từ 0 */
  index: number;
  /** vị trí trái, tính theo % chiều rộng dòng thời gian */
  left: number;
  /** "TUẦN 44 · 26.10" */
  label: string;
}

export interface TimelineLayout {
  /** 00:00 thứ Hai của tuần đầu tiên, ms */
  startMs: number;
  spanMs: number;
  weeks: TimelineWeek[];
  /** "26.10 → 22.11" */
  rangeLabel: string;
}

export function buildTimelineLayout(dueAts: string[], fallbackNow: number): TimelineLayout {
  const times = dueAts.map((d) => Date.parse(d));
  const earliest = times.length ? Math.min(...times) : fallbackNow;
  const latest = times.length ? Math.max(...times) : fallbackNow;

  const firstMonday = mondayOf(dayIndex(earliest));
  const lastMonday = mondayOf(dayIndex(latest));
  const weekCount = (lastMonday - firstMonday) / 7 + 1;

  const weeks: TimelineWeek[] = Array.from({ length: weekCount }, (_, index) => {
    const monday = firstMonday + index * 7;
    return {
      index,
      left: (index / weekCount) * 100,
      label: `TUẦN ${isoWeek(monday)} · ${dotLabel(monday)}`,
    };
  });

  return {
    startMs: startOfDay(firstMonday),
    spanMs: weekCount * 7 * DAY,
    weeks,
    rangeLabel: `${dotLabel(firstMonday)} → ${dotLabel(firstMonday + weekCount * 7 - 1)}`,
  };
}

/** Vị trí `left` (%) của một thời điểm trên dòng thời gian, kẹp trong [0, 100]. */
export function pctOf(layout: Pick<TimelineLayout, 'startMs' | 'spanMs'>, ms: number): number {
  return Math.min(100, Math.max(0, ((ms - layout.startMs) / layout.spanMs) * 100));
}

/** Chỉ số tuần (từ 0) mà thời điểm `ms` rơi vào. */
export function weekIndexOf(layout: Pick<TimelineLayout, 'startMs'>, ms: number): number {
  return Math.floor((ms - layout.startMs) / (7 * DAY));
}
