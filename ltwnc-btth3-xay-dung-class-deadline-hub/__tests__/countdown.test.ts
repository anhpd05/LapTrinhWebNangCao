import { chipText, clockParts, daysLeft, statusOf, weekBucket } from '@/lib/countdown';

const HOUR = 3_600_000;
const MINUTE = 60_000;
const at = (iso: string) => Date.parse(iso);

describe('quá hạn', () => {
  const due = '2026-11-03T10:00:00+07:00';
  const twoHoursLater = at('2026-11-03T12:00:00+07:00');

  test('quá hạn 2 giờ ra -1 chứ không ra -0', () => {
    const days = daysLeft(due, twoHoursLater);
    expect(days).toBe(-1);
    expect(Object.is(days, -0)).toBe(false);
  });

  test('chip hiện "Quá hạn 1 ngày", và "Đã xong" thắng trạng thái quá hạn', () => {
    expect(chipText(due, twoHoursLater, false)).toBe('Quá hạn 1 ngày');
    expect(chipText(due, twoHoursLater, true)).toBe('Đã xong');
  });

  test('quá hạn 25 giờ ra "Quá hạn 2 ngày"', () => {
    expect(chipText(due, at(due) + 25 * HOUR, false)).toBe('Quá hạn 2 ngày');
  });
});

describe('statusOf: ranh giới 72 giờ', () => {
  const now = at('2026-11-03T10:00:00+07:00');
  const dueIn = (ms: number) => new Date(now + ms).toISOString();

  test('còn đúng 72 giờ là soon', () => {
    expect(statusOf(dueIn(72 * HOUR), now)).toBe('soon');
  });
  test('72 giờ + 1 phút là ok', () => {
    expect(statusOf(dueIn(72 * HOUR + MINUTE), now)).toBe('ok');
  });
  test('vừa quá hạn 1 mili giây là late', () => {
    expect(statusOf(dueIn(-1), now)).toBe('late');
  });
});

describe('chipText theo ngày lịch giờ VN', () => {
  const now = at('2026-11-03T10:00:00+07:00');

  test('hạn 23:59 cùng ngày là "Hạn hôm nay"', () => {
    expect(chipText('2026-11-03T23:59:00+07:00', now, false)).toBe('Hạn hôm nay');
  });
  test('hạn 23:59 ngày mai là "Còn 1 ngày"', () => {
    expect(chipText('2026-11-04T23:59:00+07:00', now, false)).toBe('Còn 1 ngày');
  });
});

describe('weekBucket: tuần bắt đầu thứ Hai 00:00 giờ VN', () => {
  // 03/11/2026 là thứ Ba.
  const now = at('2026-11-03T10:00:00+07:00');

  test.each([
    ['2026-11-03T09:59:59+07:00', 'late'],
    ['2026-11-08T23:59:59+07:00', 'thisWeek'], // Chủ nhật cuối tuần
    ['2026-11-09T00:00:00+07:00', 'nextWeek'], // thứ Hai 00:00
    ['2026-11-15T23:59:59+07:00', 'nextWeek'],
    ['2026-11-16T00:00:00+07:00', 'later'],
  ])('%s -> %s', (due, expected) => {
    expect(weekBucket(due, now)).toBe(expected);
  });

  test('ranh giới tuần tính theo giờ VN, không theo UTC', () => {
    // 2026-11-08T17:30Z đã là 00:30 thứ Hai 09/11 ở VN.
    expect(weekBucket('2026-11-08T17:30:00Z', now)).toBe('nextWeek');
  });
});

describe('clockParts', () => {
  test('tách ngày, giờ, phút, giây', () => {
    const now = at('2026-11-03T14:11:26+07:00');
    expect(clockParts('2026-11-04T23:59:00+07:00', now)).toEqual({ d: 1, h: 9, m: 47, s: 34 });
  });
  test('quá hạn thì mọi phần về 0', () => {
    const due = '2026-11-03T10:00:00+07:00';
    expect(clockParts(due, at(due) + HOUR)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
});
