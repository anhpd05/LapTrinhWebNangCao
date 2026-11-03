import { z } from 'zod';

export const SUBJECT_CODES = ['WEB', 'CSDL', 'MMT', 'TRR'] as const;

export const TITLE_MIN = 5;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;
export const SUBMIT_VIA_MAX = 120;

function isRealDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Dùng chung cho form (client) và Server Action: cùng một luật, cùng một thông điệp lỗi. */
export const createDeadlineSchema = z.object({
  title: z
    .string({ error: 'Tiêu đề là bắt buộc' })
    .trim()
    .min(TITLE_MIN, `Tiêu đề phải từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự`)
    .max(TITLE_MAX, `Tiêu đề phải từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự`),
  subjectCode: z.enum(SUBJECT_CODES, { error: 'Hãy chọn một môn học' }),
  dueDate: z
    .string({ error: 'Hãy chọn ngày hạn' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hạn phải có dạng YYYY-MM-DD')
    .refine(isRealDate, 'Ngày hạn không hợp lệ')
    .transform((date) => `${date}T23:59:00+07:00`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Mô tả tối đa ${DESCRIPTION_MAX} ký tự`),
  submitVia: z
    .string()
    .trim()
    .max(SUBMIT_VIA_MAX, `"Nộp qua" tối đa ${SUBMIT_VIA_MAX} ký tự`),
});

export const idSchema = z.string().regex(/^\d+$/);

export type ActionResult = { ok: boolean; message?: string; error?: string };

export type CreateDeadlineState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
  message?: string;
  values?: { title: string; subjectCode: string; dueDate: string; description: string; submitVia: string };
};
