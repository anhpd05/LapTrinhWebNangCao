'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  addDeadline,
  appendRevalidateLog,
  getCompletedIds,
  getDeadline,
  getSubjectByCode,
  removeDeadline,
  toggleCompleted,
} from '@/lib/data';
import { can, roleOf, type Action } from '@/lib/permissions';
import {
  createDeadlineSchema,
  idSchema,
  type ActionResult,
  type CreateDeadlineState,
} from '@/lib/validation';

// Mọi action đi theo thứ tự: auth -> can -> validate -> ghi -> revalidate -> log.
// userId luôn lấy từ session, không bao giờ lấy từ input của client.

const NO_PERMISSION = 'Không có quyền';

/** Trả về session nếu người gọi có quyền, ngược lại `null` (kể cả guest). */
async function authorize(action: Action) {
  const session = await auth();
  if (!session?.user || !can(roleOf(session), action)) return null;
  return session;
}

// revalidatePath với `type` ('page' | 'layout') nhận ĐƯỜNG DẪN FILE ROUTE, gồm cả route group: Next gắn tag
// cache cho trang là `/(public)/deadlines/[id]/page`. Viết thiếu group (`/deadlines/[id]`) thì không khớp tag
// nào và trang chi tiết không được làm mới (lỗi đã gặp trên production: xoá #13 xong /deadlines/13 vẫn trả bài cũ).
const DETAIL_ROUTE = '/(public)/deadlines/[id]';
const DASHBOARD_ROUTE = '/(app)/dashboard';

/** Làm mới các trang public bị ảnh hưởng khi danh sách deadline đổi. Trả về nhãn để ghi log. */
function revalidateDeadlineChange(id: string, subjectSlug: string | undefined): string[] {
  const paths: string[] = ['/'];
  revalidatePath('/');
  // Chính trang bị thêm/xoá, và mọi trang chi tiết khác (khối "Cùng môn" liệt kê deadline của môn).
  revalidatePath(`/deadlines/${id}`);
  revalidatePath(DETAIL_ROUTE, 'page');
  paths.push(`/deadlines/${id}`);
  if (subjectSlug) {
    revalidatePath(`/subjects/${subjectSlug}`);
    paths.push(`/subjects/${subjectSlug}`);
  }
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin');
  revalidatePath(DASHBOARD_ROUTE, 'layout');
  // Cố ý KHÔNG revalidate '/deadlines': trang này chỉ làm mới theo chu kỳ 60 giây.
  return paths;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function createDeadlineAction(
  _prev: CreateDeadlineState,
  formData: FormData,
): Promise<CreateDeadlineState> {
  const values = {
    title: formString(formData, 'title'),
    subjectCode: formString(formData, 'subjectCode'),
    dueDate: formString(formData, 'dueDate'),
    description: formString(formData, 'description'),
    submitVia: formString(formData, 'submitVia'),
  };

  if (!(await authorize('deadline:create'))) return { ok: false, error: NO_PERMISSION, values };

  const parsed = createDeadlineSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '_');
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Vui lòng kiểm tra lại các trường bên dưới', fieldErrors, values };
  }

  const { title, subjectCode, dueDate, description, submitVia } = parsed.data;
  const created = await addDeadline({ title, subjectCode, dueAt: dueDate, description, submitVia });
  const subject = await getSubjectByCode(created.subjectCode);

  const paths = revalidateDeadlineChange(created.id, subject?.slug);
  await appendRevalidateLog(`Thêm #${created.id} · làm mới ${paths.join(', ')}`);

  return {
    ok: true,
    id: created.id,
    message: `Đã thêm #${created.id}. Mở /deadlines/${created.id} xem được ngay.`,
  };
}

export async function deleteDeadlineAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await authorize('deadline:delete'))) return { ok: false, error: NO_PERMISSION };

  const parsedId = idSchema.safeParse(formString(formData, 'id'));
  if (!parsedId.success) return { ok: false, error: 'Mã deadline không hợp lệ' };
  const id = parsedId.data;

  const existing = await getDeadline(id);
  if (!existing) return { ok: false, error: `Deadline #${id} không tồn tại` };
  const subject = await getSubjectByCode(existing.subjectCode);

  if (!(await removeDeadline(id))) return { ok: false, error: `Deadline #${id} không tồn tại` };

  const paths = revalidateDeadlineChange(id, subject?.slug);
  await appendRevalidateLog(`Xoá #${id} · làm mới ${paths.join(', ')}`);

  return { ok: true, message: `Đã xoá #${id}. Mở lại /deadlines/${id} sẽ ra trang 404.` };
}

export async function toggleCompleteAction(
  id: string,
): Promise<{ ok: boolean; error?: string; completedIds?: string[] }> {
  const session = await authorize('deadline:complete');
  if (!session) return { ok: false, error: NO_PERMISSION };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'Mã deadline không hợp lệ' };

  if (!(await getDeadline(parsedId.data))) {
    return { ok: false, error: `Deadline #${parsedId.data} không tồn tại` };
  }

  const userId = session.user.id;
  await toggleCompleted(userId, parsedId.data);
  // Tiến độ là dữ liệu riêng của từng người: chỉ làm mới /dashboard, không đụng trang public.
  revalidatePath(DASHBOARD_ROUTE, 'layout');

  return { ok: true, completedIds: await getCompletedIds(userId) };
}
