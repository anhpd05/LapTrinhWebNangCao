'use client';

import { useActionState, useState } from 'react';
import { createDeadlineAction } from '@/lib/actions';
import { calendarDaysLeft } from '@/lib/countdown';
import { formatDayMonth } from '@/lib/format';
import type { Subject } from '@/lib/types';
import {
  createDeadlineSchema,
  DESCRIPTION_MAX,
  SUBMIT_VIA_MAX,
  TITLE_MAX,
  TITLE_MIN,
  type CreateDeadlineState,
} from '@/lib/validation';
import { useNow } from '@/hooks/use-now';
import { useAdminToast } from './admin-toast';

type FieldName = 'title' | 'subjectCode' | 'dueDate' | 'description' | 'submitVia';
type FieldErrors = Partial<Record<FieldName, string>>;

interface CreateDeadlineFormProps {
  subjects: Subject[];
  /** Date.now() lúc server render (SSR), cho useNow để lần render đầu khớp với HTML server. */
  renderedAt: number;
  /** Ngày hạn mặc định (YYYY-MM-DD) do server tính, để HTML server và client giống nhau. */
  defaultDate: string;
  /** Cột phải, dưới thẻ xem trước (RevalidateLog là Server Component nên truyền vào qua children). */
  children?: React.ReactNode;
}

const INPUT_BASE = 'rounded-field bg-card font-[inherit] outline-offset-2';
const MSG_ID: Record<FieldName, string> = {
  title: 'title-msg',
  subjectCode: 'subject-msg',
  dueDate: 'date-msg',
  description: 'description-msg',
  submitVia: 'submit-via-msg',
};

export function CreateDeadlineForm({ subjects, renderedAt, defaultDate, children }: CreateDeadlineFormProps) {
  const showToast = useAdminToast();
  const now = useNow(renderedAt, 60_000);

  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState<string>(subjects[0]?.code ?? '');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [description, setDescription] = useState('');
  const [submitVia, setSubmitVia] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Lỗi do server trả về; xoá từng field khi người dùng sửa lại field đó.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const [state, formAction, pending] = useActionState<CreateDeadlineState, FormData>(
    async (prev, formData) => {
      const result = await createDeadlineAction(prev, formData);
      if (result.ok) {
        if (result.message) showToast(result.message);
        setTitle('');
        setDescription('');
        setSubmitVia('');
        setServerErrors({});
      } else {
        const next: FieldErrors = {};
        for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (key in MSG_ID) next[key as FieldName] = messages[0];
        }
        setServerErrors(next);
      }
      return result;
    },
    { ok: false },
  );

  // Cùng một schema zod với Server Action (lib/validation.ts): form và server không thể lệch luật.
  const parsed = createDeadlineSchema.safeParse({ title, subjectCode, dueDate, description, submitVia });
  const schemaErrors: FieldErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as FieldName;
      schemaErrors[key] ??= issue.message;
    }
  }

  const trimmedLength = title.trim().length;
  // Ngày hợp lệ (theo schema) thì mới tính được "còn N ngày"; không phụ thuộc lỗi của field khác.
  const dueAt = `${dueDate}T23:59:00+07:00`;
  const dueDateOk = !schemaErrors.dueDate;
  const daysLeft = dueDateOk ? calendarDaysLeft(dueAt, now) : Number.NaN;
  const dateInPast = dueDateOk && daysLeft < 0;
  const todayLabel = formatDayMonth(new Date(now).toISOString());
  if (dateInPast) schemaErrors.dueDate = `Hạn nộp phải từ hôm nay (${todayLabel}) trở đi.`;

  const valid = parsed.success && !dateInPast;
  const errors: FieldErrors = { ...serverErrors, ...schemaErrors };
  // Ô trống chưa chạm vào thì hiện gợi ý chứ chưa báo lỗi.
  const titleIsEmpty = trimmedLength === 0;
  const titleError = titleIsEmpty ? undefined : errors.title;
  const dateError = errors.dueDate;
  const detailsHaveError = Boolean(errors.description || errors.submitVia);

  const clearServerError = (field: FieldName) =>
    setServerErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const subject = subjects.find((s) => s.code === subjectCode);
  const previewDate = dueDateOk ? formatDayMonth(dueAt) : '--/--';
  const previewDays = dueDateOk ? Math.max(0, daysLeft) : '–';

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[3_1_420px] flex-col gap-4 rounded-[22px] border border-line bg-card p-6">
        <h2 className="font-display text-[22px] font-bold">Deadline mới</h2>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="deadline-title" className="text-sm font-semibold">
              Tiêu đề
            </label>
            <span
              id="title-count"
              className={`font-mono text-xs ${titleError ? 'text-late' : 'text-muted'}`}
            >
              {trimmedLength}/{TITLE_MAX}
            </span>
          </div>
          <input
            id="deadline-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearServerError('title');
            }}
            placeholder="VD: Bài tập Buổi 9: Server Actions"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={`title-count ${MSG_ID.title}`}
            autoComplete="off"
            className={`${INPUT_BASE} min-h-[50px] px-4 text-base ${
              titleIsEmpty
                ? 'border border-[#c4c9d2]'
                : titleError
                  ? 'border-2 border-late'
                  : 'border-2 border-[#1e8e5a]'
            }`}
          />
          <span
            id={MSG_ID.title}
            className={`text-[13px] font-semibold ${
              titleIsEmpty ? 'text-muted' : titleError ? 'text-late' : 'text-[#11663f]'
            }`}
          >
            {titleIsEmpty ? `Bắt buộc · ${TITLE_MIN} đến ${TITLE_MAX} ký tự` : (titleError ?? 'Hợp lệ')}
          </span>
        </div>

        <fieldset className="flex min-w-0 flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">Môn học</legend>
          <div
            role="radiogroup"
            aria-label="Môn học"
            aria-describedby={errors.subjectCode ? MSG_ID.subjectCode : undefined}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-2"
          >
            {subjects.map((s) => (
              <label
                key={s.code}
                className="flex min-h-[46px] cursor-pointer items-center gap-2 rounded-field border-2 border-line bg-card px-3 text-sm font-semibold has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link"
              >
                <input
                  type="radio"
                  name="subjectCode"
                  value={s.code}
                  checked={subjectCode === s.code}
                  onChange={() => {
                    setSubjectCode(s.code);
                    clearServerError('subjectCode');
                  }}
                  className="sr-only"
                />
                <span aria-hidden="true" className="size-2.5 flex-none rounded-[3px]" style={{ backgroundColor: s.color.c }} />
                {s.name}
              </label>
            ))}
          </div>
          {errors.subjectCode ? (
            <span id={MSG_ID.subjectCode} className="text-[13px] font-semibold text-late">
              {errors.subjectCode}
            </span>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="deadline-date" className="text-sm font-semibold">
            Ngày hạn (23:59)
          </label>
          <input
            id="deadline-date"
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              clearServerError('dueDate');
            }}
            aria-invalid={dateError ? true : undefined}
            aria-describedby={MSG_ID.dueDate}
            className={`${INPUT_BASE} min-h-12 px-3 text-[15px] ${
              dateError ? 'border-2 border-late' : 'border border-[#c4c9d2]'
            }`}
          />
          <span id={MSG_ID.dueDate} className={`text-[13px] font-semibold ${dateError ? 'text-late' : 'text-muted'}`}>
            {dateError ?? `Còn ${daysLeft} ngày kể từ hôm nay`}
          </span>
        </div>

        <details
          open={detailsOpen || detailsHaveError}
          onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
          className="rounded-field border border-line px-4 py-3"
        >
          <summary className="cursor-pointer text-sm font-semibold">Thêm chi tiết</summary>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="deadline-description" className="text-sm font-semibold">
                  Mô tả
                </label>
                <span className="font-mono text-xs text-muted">
                  {description.trim().length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id="deadline-description"
                name="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearServerError('description');
                }}
                rows={4}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={MSG_ID.description}
                className={`${INPUT_BASE} px-3 py-2.5 text-[15px] ${
                  errors.description ? 'border-2 border-late' : 'border border-[#c4c9d2]'
                }`}
              />
              <span
                id={MSG_ID.description}
                className={`text-[13px] font-semibold ${errors.description ? 'text-late' : 'text-muted'}`}
              >
                {errors.description ?? `Tuỳ chọn · tối đa ${DESCRIPTION_MAX} ký tự`}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="deadline-submit-via" className="text-sm font-semibold">
                  Nộp qua
                </label>
                <span className="font-mono text-xs text-muted">
                  {submitVia.trim().length}/{SUBMIT_VIA_MAX}
                </span>
              </div>
              <input
                id="deadline-submit-via"
                name="submitVia"
                type="text"
                value={submitVia}
                onChange={(e) => {
                  setSubmitVia(e.target.value);
                  clearServerError('submitVia');
                }}
                placeholder="VD: Google Classroom"
                aria-invalid={errors.submitVia ? true : undefined}
                aria-describedby={MSG_ID.submitVia}
                className={`${INPUT_BASE} min-h-12 px-3 text-[15px] ${
                  errors.submitVia ? 'border-2 border-late' : 'border border-[#c4c9d2]'
                }`}
              />
              <span
                id={MSG_ID.submitVia}
                className={`text-[13px] font-semibold ${errors.submitVia ? 'text-late' : 'text-muted'}`}
              >
                {errors.submitVia ?? `Tuỳ chọn · tối đa ${SUBMIT_VIA_MAX} ký tự`}
              </span>
            </div>
          </div>
        </details>

        {state.error && !state.ok ? (
          <p role="alert" className="text-sm font-semibold text-late">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!valid || pending}
          className={`min-h-[52px] rounded-card text-base font-extrabold ${
            !valid || pending
              ? 'cursor-not-allowed bg-line text-muted'
              : 'cursor-pointer bg-lime text-ink'
          }`}
        >
          {pending ? 'Đang thêm…' : '+ Thêm deadline'}
        </button>
      </div>

      <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-3.5">
        <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">
          XEM TRƯỚC · CẬP NHẬT KHI GÕ
        </span>
        <div
          aria-label="Xem trước thẻ deadline"
          role="group"
          className="relative flex min-h-[210px] flex-col gap-3.5 overflow-hidden rounded-[22px] bg-ink p-[22px] text-white"
        >
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-10 size-[150px] rounded-pill border-[18px]"
            style={{ borderColor: subject?.color.c ?? '#7AA2FF' }}
          />
          <span
            className="relative self-start rounded-pill px-2.5 py-1 font-mono text-xs font-bold text-ink"
            style={{ backgroundColor: subject?.color.c ?? '#7AA2FF' }}
          >
            {subject?.code ?? '—'}
          </span>
          <span className="relative max-w-[85%] font-display text-[26px] font-extrabold leading-[1.08] [overflow-wrap:anywhere]">
            {trimmedLength ? title.trim() : 'Tiêu đề deadline'}
          </span>
          <span className="relative mt-auto flex items-baseline gap-2">
            <span className="font-display text-[52px] font-extrabold leading-[0.9] text-lime">{previewDays}</span>
            <span className="text-[15px] font-semibold text-[#c3c9d4]">ngày nữa · {previewDate}</span>
          </span>
        </div>
        {children}
      </div>
    </form>
  );
}
