import { safeCallback } from '@/lib/safe-callback';

describe('safeCallback', () => {
  test.each(['/dashboard', '/deadlines/7', '/admin?tab=1', '/subjects/lap-trinh-web#top'])(
    'giữ nguyên đường dẫn nội bộ %s',
    (path) => {
      expect(safeCallback(path)).toBe(path);
    },
  );

  test.each([
    ['//evil.com'],
    ['/\\evil.com'],
    ['https://evil.com'],
    ['javascript:alert(1)'],
    [''],
    ['/\t/evil.com'],
    ['/\n/evil.com'],
  ])('%j -> fallback', (raw) => {
    expect(safeCallback(raw)).toBe('/dashboard');
  });

  test.each([[null], [undefined]])('%s -> fallback', (raw) => {
    expect(safeCallback(raw)).toBe('/dashboard');
  });

  test('/login và /api/auth bị từ chối để không lặp chuyển hướng', () => {
    expect(safeCallback('/login')).toBe('/dashboard');
    expect(safeCallback('/login?callbackUrl=%2Fadmin')).toBe('/dashboard');
    expect(safeCallback('/api/auth/signout')).toBe('/dashboard');
    // không nhầm với đường dẫn chỉ bắt đầu giống
    expect(safeCallback('/login-help')).toBe('/login-help');
  });

  test('tham số fallback được dùng khi giá trị không hợp lệ', () => {
    expect(safeCallback('//evil.com', '/')).toBe('/');
  });
});
