/**
 * Các hàm thời gian thuần (không phụ thuộc React), nhận `now` (ms) làm tham số.
 * Mọi chip trạng thái, nhóm tuần, đồng hồ trong app đều dùng chung file này.
 */

export type DeadlineStatus = 'late' | 'soon' | 'ok';
export type WeekBucket = 'late' | 'thisWeek' | 'nextWeek' | 'later';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Việt Nam là UTC+7 quanh năm (không có giờ mùa hè), nên đổi sang giờ VN bằng cách cộng 7 tiếng
// rồi đọc theo UTC. Cách này không phụ thuộc múi giờ của máy chạy.
const VN_OFFSET = 7 * HOUR;

/** Số thứ tự ngày (từ 1970-01-01) của một thời điểm, tính theo lịch giờ VN. */
function vnDayIndex(ms: number): number {
  return Math.floor((ms + VN_OFFSET) / DAY);
}

/** Số thứ tự tuần, tuần bắt đầu từ thứ Hai (1970-01-01 là thứ Năm nên lùi 3 ngày). */
function vnWeekIndex(ms: number): number {
  return Math.floor((vnDayIndex(ms) + 3) / 7);
}

export function msLeft(dueAt: string, now: number): number {
  return Date.parse(dueAt) - now;
}

/**
 * Số ngày còn lại, làm tròn lên. Quá hạn thì trả số âm, tối thiểu `-1`
 * (quá hạn vài giờ ra `-1` chứ không ra `-0`).
 */
export function daysLeft(dueAt: string, now: number): number {
  const diff = msLeft(dueAt, now);
  return diff >= 0 ? Math.ceil(diff / DAY) : -Math.ceil(-diff / DAY);
}

export function statusOf(dueAt: string, now: number): DeadlineStatus {
  const diff = msLeft(dueAt, now);
  if (diff < 0) return 'late';
  return diff <= 72 * HOUR ? 'soon' : 'ok';
}

/**
 * Chữ trên chip trạng thái. "Hạn hôm nay" và "Còn N ngày" đếm theo ngày lịch giờ VN
 * (hạn 23:59 ngày mai là "Còn 1 ngày"), còn "Quá hạn N ngày" đếm theo `daysLeft`.
 */
export function chipText(dueAt: string, now: number, done: boolean): string {
  if (done) return 'Đã xong';
  if (msLeft(dueAt, now) < 0) return `Quá hạn ${-daysLeft(dueAt, now)} ngày`;
  const calendarDays = vnDayIndex(Date.parse(dueAt)) - vnDayIndex(now);
  return calendarDays === 0 ? 'Hạn hôm nay' : `Còn ${calendarDays} ngày`;
}

/** Nhóm theo tuần giờ VN (tuần bắt đầu thứ Hai). Đã quá hạn thì luôn là `late`. */
export function weekBucket(dueAt: string, now: number): WeekBucket {
  const due = Date.parse(dueAt);
  if (due < now) return 'late';
  const weeksAhead = vnWeekIndex(due) - vnWeekIndex(now);
  if (weeksAhead === 0) return 'thisWeek';
  if (weeksAhead === 1) return 'nextWeek';
  return 'later';
}

/** Các phần của đồng hồ đếm ngược, mỗi phần ≥ 0 (quá hạn thì về 0). */
export function clockParts(dueAt: string, now: number): { d: number; h: number; m: number; s: number } {
  const diff = Math.max(0, msLeft(dueAt, now));
  return {
    d: Math.floor(diff / DAY),
    h: Math.floor((diff % DAY) / HOUR),
    m: Math.floor((diff % HOUR) / MINUTE),
    s: Math.floor((diff % MINUTE) / SECOND),
  };
}
