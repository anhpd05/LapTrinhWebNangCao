export const CATEGORIES = [
  'Điện thoại',
  'Laptop',
  'Máy tính bảng',
  'Phụ kiện',
  'Âm thanh',
  'Đồng hồ thông minh',
  'Màn hình',
  'Thiết bị mạng',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Giá trị của bộ lọc danh mục: một danh mục hoặc `all` (không lọc). */
export type CategoryFilter = Category | 'all';

export type SortField = 'name' | 'price';

export type SortKey = 'none' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  stock: number;
  /** Ngày tạo dạng `YYYY-MM-DD`. */
  createdAt: string;
}

export function isCategoryFilter(value: string): value is CategoryFilter {
  return value === 'all' || (CATEGORIES as readonly string[]).includes(value);
}
