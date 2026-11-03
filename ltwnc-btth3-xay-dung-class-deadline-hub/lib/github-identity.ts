import type { Role, UserRecord } from './types';

export interface GithubIdentity {
  id: string;
  name?: string;
  role: Role;
  initials: string;
  studentId: string;
}

/** "Phạm Đức Anh" -> "PA" (chữ đầu của từ đầu + từ cuối); một từ thì lấy 2 ký tự đầu. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0]);
  const raw = words.length === 1 ? first.slice(0, 2).join('') : first[0] + Array.from(words[words.length - 1])[0];
  return raw.toLocaleUpperCase('vi');
}

/**
 * Quyết định danh tính của người đăng nhập bằng GitHub. Nơi DUY NHẤT cấp role cho tài khoản GitHub:
 * - `linked` (tài khoản trong users.json trùng email GitHub đã xác minh) -> dùng nguyên id/role/mã SV
 *   của tài khoản đó, nên chung tiến độ với đăng nhập bằng mật khẩu;
 * - không trùng -> sinh viên (`user`), id cố định theo id GitHub. Không bao giờ ra `admin`.
 */
export function githubIdentity(
  linked: UserRecord | undefined,
  github: { providerAccountId: string; name?: string | null },
): GithubIdentity {
  if (linked) {
    return {
      id: linked.id,
      name: linked.name,
      role: linked.role,
      initials: linked.initials,
      studentId: linked.studentId,
    };
  }
  return {
    id: `gh-${github.providerAccountId}`,
    role: 'user',
    initials: initialsOf(github.name ?? ''),
    studentId: '',
  };
}
