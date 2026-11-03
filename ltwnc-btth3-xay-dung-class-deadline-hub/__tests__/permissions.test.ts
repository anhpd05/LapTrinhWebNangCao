import { can, roleOf, type Action, type ActorRole } from '@/lib/permissions';

// Bảng quyền theo đề: mỗi hàng là [role, action, kỳ vọng]. Đủ 12 ô (3 role x 4 action).
const CASES: [ActorRole, Action, boolean][] = [
  ['guest', 'deadline:view', true],
  ['guest', 'deadline:complete', false],
  ['guest', 'deadline:create', false],
  ['guest', 'deadline:delete', false],
  ['user', 'deadline:view', true],
  ['user', 'deadline:complete', true],
  ['user', 'deadline:create', false],
  ['user', 'deadline:delete', false],
  ['admin', 'deadline:view', true],
  ['admin', 'deadline:complete', true],
  ['admin', 'deadline:create', true],
  ['admin', 'deadline:delete', true],
];

describe('can()', () => {
  test.each(CASES)('%s + %s -> %s', (role, action, expected) => {
    expect(can(role, action)).toBe(expected);
  });
});

describe('roleOf()', () => {
  test('không có session thì là guest', () => {
    expect(roleOf(null)).toBe('guest');
  });
});
