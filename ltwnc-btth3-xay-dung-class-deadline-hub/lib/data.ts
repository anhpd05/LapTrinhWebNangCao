import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Deadline, Progress, Subject, UserRecord } from './types';

/**
 * Module DUY NHẤT được chạm vào hệ thống file. Nếu sau này đổi nơi lưu dữ liệu
 * (DB, Blob...) chỉ cần sửa file này.
 */

async function readJson<T>(name: string): Promise<T> {
  const file = path.join(process.cwd(), 'data', name);
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

// Ghi ra file tạm rồi rename: người đọc không bao giờ thấy file ghi dở.
async function writeJson(name: string, value: unknown): Promise<void> {
  const target = path.join(process.cwd(), 'data', name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, target);
}

// Hàng đợi tuần tự: mỗi thao tác đọc-sửa-ghi chạy xong rồi mới đến thao tác sau,
// tránh hai request ghi đè lên nhau. Lỗi của một thao tác không làm hỏng hàng đợi.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

// ---------- Đọc ----------

export async function getSubjects(): Promise<Subject[]> {
  return readJson<Subject[]>('subjects.json');
}

export async function getSubject(slug: string): Promise<Subject | undefined> {
  return (await getSubjects()).find((s) => s.slug === slug);
}

export async function getDeadlines(): Promise<Deadline[]> {
  const list = await readJson<Deadline[]>('deadlines.json');
  return list.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

export async function getDeadline(id: string): Promise<Deadline | undefined> {
  return (await getDeadlines()).find((d) => d.id === id);
}

export async function getDeadlinesBySubject(slug: string): Promise<Deadline[]> {
  return (await getDeadlines()).filter((d) => d.subjectSlug === slug);
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  const users = await readJson<UserRecord[]>('users.json');
  const needle = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === needle);
}

export async function getCompletedIds(userId: string): Promise<string[]> {
  const progress = await readJson<Progress>('progress.json');
  return progress[userId] ?? [];
}

// ---------- Ghi ----------

export type NewDeadlineInput = Omit<Deadline, 'id' | 'createdAt'>;

export function addDeadline(input: NewDeadlineInput): Promise<Deadline> {
  return serialize(async () => {
    const list = await readJson<Deadline[]>('deadlines.json');
    const maxId = list.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0);
    const created: Deadline = {
      ...input,
      id: String(maxId + 1),
      createdAt: new Date().toISOString(),
    };
    await writeJson('deadlines.json', [...list, created]);
    return created;
  });
}

/** Xoá deadline và xoá luôn id đó khỏi tiến độ của mọi người dùng. Trả về `false` nếu id không tồn tại. */
export function removeDeadline(id: string): Promise<boolean> {
  return serialize(async () => {
    const list = await readJson<Deadline[]>('deadlines.json');
    if (!list.some((d) => d.id === id)) return false;

    const progress = await readJson<Progress>('progress.json');
    const cleaned: Progress = {};
    for (const [userId, ids] of Object.entries(progress)) {
      cleaned[userId] = ids.filter((x) => x !== id);
    }

    // Ghi progress trước: nếu dừng giữa chừng thì chỉ còn deadline thừa, không còn id mồ côi.
    await writeJson('progress.json', cleaned);
    await writeJson('deadlines.json', list.filter((d) => d.id !== id));
    return true;
  });
}

/** Đổi trạng thái "đã xong". Trả về trạng thái mới; id không tồn tại thì trả `false` và không ghi gì. */
export function toggleCompleted(userId: string, id: string): Promise<boolean> {
  return serialize(async () => {
    const list = await readJson<Deadline[]>('deadlines.json');
    if (!list.some((d) => d.id === id)) return false;

    const progress = await readJson<Progress>('progress.json');
    const current = progress[userId] ?? [];
    const done = !current.includes(id);
    progress[userId] = done ? [...current, id] : current.filter((x) => x !== id);
    await writeJson('progress.json', progress);
    return done;
  });
}
