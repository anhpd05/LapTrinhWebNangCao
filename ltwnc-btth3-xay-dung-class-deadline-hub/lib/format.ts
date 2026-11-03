const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const partsFormat = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsOf(value: string | number) {
  const out: Record<string, string> = {};
  for (const p of partsFormat.formatToParts(new Date(value))) out[p.type] = p.value;
  return { year: out.year, month: out.month, day: out.day, hour: out.hour, minute: out.minute };
}

/** "23:59 · 05/11/2026" */
export function formatDue(dueAt: string): string {
  const p = partsOf(dueAt);
  return `${p.hour}:${p.minute} · ${p.day}/${p.month}/${p.year}`;
}

/** "05/11" */
export function formatDayMonth(dueAt: string): string {
  const p = partsOf(dueAt);
  return `${p.day}/${p.month}`;
}

const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_LONG = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];

function weekdayIndex(value: string | number): number {
  const p = partsOf(value);
  return new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day))).getUTCDay();
}

/** "CN", "T2" … "T7" */
export function weekdayShort(dueAt: string): string {
  return WEEKDAYS_SHORT[weekdayIndex(dueAt)];
}

/** "THỨ BA · 03.11.2026" */
export function formatToday(now: number): string {
  const p = partsOf(now);
  return `${WEEKDAYS_LONG[weekdayIndex(now)]} · ${p.day}.${p.month}.${p.year}`;
}
