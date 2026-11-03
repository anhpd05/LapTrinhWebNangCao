import { githubIdentity, initialsOf } from '@/lib/github-identity';
import type { UserRecord } from '@/lib/types';

const ADMIN: UserRecord = {
  id: 'u-admin',
  email: 'admin@ptit.edu.vn',
  name: 'Phạm Đức Anh',
  initials: 'PA',
  passwordHash: 'x',
  role: 'admin',
  studentId: 'B23DCCC014',
};

describe('githubIdentity()', () => {
  test('email trùng users.json: giữ nguyên id, role, mã SV (chung tiến độ với đăng nhập mật khẩu)', () => {
    expect(githubIdentity(ADMIN, { providerAccountId: '123', name: 'octocat' })).toEqual({
      id: 'u-admin',
      name: 'Phạm Đức Anh',
      role: 'admin',
      initials: 'PA',
      studentId: 'B23DCCC014',
    });
  });

  test('không trùng: luôn là user với id cố định theo id GitHub, không thể thành admin', () => {
    const a = githubIdentity(undefined, { providerAccountId: '123', name: 'Nguyễn Văn An' });
    const b = githubIdentity(undefined, { providerAccountId: '123', name: 'Nguyễn Văn An' });
    expect(a).toEqual({ id: 'gh-123', role: 'user', initials: 'NA', studentId: '' });
    expect(b.id).toBe(a.id);
  });

  test('GitHub không có tên hiển thị: không lỗi', () => {
    expect(githubIdentity(undefined, { providerAccountId: '9', name: null }).initials).toBe('?');
  });
});

describe('initialsOf()', () => {
  test.each([
    ['Phạm Đức Anh', 'PA'],
    ['  nguyễn   mai sao ', 'NS'],
    ['octocat', 'OC'],
    ['Đỗ Bình', 'ĐB'],
    ['', '?'],
  ])('%j -> %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
