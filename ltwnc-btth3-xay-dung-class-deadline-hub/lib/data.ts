import 'server-only';
import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  Deadline,
  Progress,
  RevalidateLogEntry,
  Subject,
  SubjectCode,
  UserRecord,
} from './types';

/**
 * Module DUY NHẤT được chạm vào hệ thống file và là nơi DUY NHẤT đọc `DATA_DIR`.
 * Nếu sau này đổi nơi lưu dữ liệu (DB, Blob...) chỉ cần sửa file này.
 */

const SEED_DIR = path.join(process.cwd(), 'data');

// Trên Hostinger, DATA_DIR trỏ ra NGOÀI thư mục code vì mỗi lần deploy Hostinger ghi đè
// toàn bộ thư mục website. Để trống thì dùng ./data (dev/local).
const DATA_DIR = process.env.DATA_DIR || SEED_DIR;

// Mỗi file chỉ được seed một lần mỗi tiến trình; file đã có trong DATA_DIR thì không bao giờ bị ghi đè.
const seeded = new Map<string, Promise<void>>();

function ensureDataFile(name: string): Promise<void> {
  let ready = seeded.get(name);
  if (!ready) {
    ready = (async () => {
      const target = path.join(DATA_DIR, name);
      try {
        await fs.access(target);
        return;
      } catch {
        // chưa có: chép bản seed sang
      }
      await fs.mkdir(DATA_DIR, { recursive: true });
      // COPYFILE_EXCL: nếu có tiến trình khác vừa tạo xong thì bỏ qua, không ghi đè.
      await fs.copyFile(path.join(SEED_DIR, name), target, fsConstants.COPYFILE_EXCL).catch((err) => {
        if (err.code !== 'EEXIST') throw err;
      });
    })();
    // Seed lỗi thì cho phép thử lại ở lần gọi sau.
    ready.catch(() => seeded.delete(name));
    seeded.set(name, ready);
  }
  return ready;
}

// Dữ liệu tham chiếu (môn học, tài khoản): runtime không bao giờ ghi, nên đọc thẳng từ thư mục
// code. Mỗi lần deploy chúng được cập nhật theo code; không bị "kẹt" bản cũ trong DATA_DIR.
const REFERENCE_FILES: Record<string, true> = { 'subjects.json': true, 'users.json': true };

async function readJson<T>(name: string): Promise<T> {
  if (REFERENCE_FILES[name]) {
    return JSON.parse(await fs.readFile(path.join(SEED_DIR, name), 'utf8')) as T;
  }
  await ensureDataFile(name);
  return JSON.parse(await fs.readFile(path.join(DATA_DIR, name), 'utf8')) as T;
}

// Ghi ra file tạm rồi rename: người đọc không bao giờ thấy file ghi dở.
async function writeJson(name: string, value: unknown): Promise<void> {
  await ensureDataFile(name);
  const target = path.join(DATA_DIR, name);
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

export async function getSubjectBySlug(slug: string): Promise<Subject | undefined> {
  return (await getSubjects()).find((s) => s.slug === slug);
}

export async function getSubjectByCode(code: SubjectCode): Promise<Subject | undefined> {
  return (await getSubjects()).find((s) => s.code === code);
}

export async function getDeadlines(): Promise<Deadline[]> {
  const list = await readJson<Deadline[]>('deadlines.json');
  return list.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

export async function getDeadline(id: string): Promise<Deadline | undefined> {
  return (await getDeadlines()).find((d) => d.id === id);
}

export async function getDeadlinesBySubject(code: SubjectCode): Promise<Deadline[]> {
  return (await getDeadlines()).filter((d) => d.subjectCode === code);
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

/** Nhật ký làm mới trang, mới nhất trước. */
export async function getRevalidateLog(limit = 20): Promise<RevalidateLogEntry[]> {
  const log = await readJson<RevalidateLogEntry[]>('revalidate-log.json');
  return log.slice(-limit).reverse();
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

const MAX_LOG_ENTRIES = 20;

/** Thêm một dòng vào nhật ký làm mới trang, chỉ giữ 20 dòng gần nhất. */
export function appendRevalidateLog(text: string): Promise<void> {
  return serialize(async () => {
    const log = await readJson<RevalidateLogEntry[]>('revalidate-log.json');
    const next = [...log, { at: new Date().toISOString(), text }].slice(-MAX_LOG_ENTRIES);
    await writeJson('revalidate-log.json', next);
  });
}
