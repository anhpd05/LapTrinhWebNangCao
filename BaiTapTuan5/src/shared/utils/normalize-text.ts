const COMBINING_MARKS = /[\u0300-\u036f]/g;
const D_WITH_STROKE = /đ/g;

/** NFD, bỏ dấu, `đ` → `d`, chữ thường, bỏ khoảng trắng hai đầu. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(D_WITH_STROKE, 'd')
    .trim();
}
