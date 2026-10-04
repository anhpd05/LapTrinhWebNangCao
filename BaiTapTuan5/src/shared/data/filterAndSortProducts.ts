import type { AriaAttributes } from 'react';
import { perfCount } from '../perf/perf';
import type { CategoryFilter, Product, SortField, SortKey } from '../types/product';
import { normalizeText } from '../utils/normalize-text';

export interface ProductFilter {
  /** Chuỗi đã chuẩn hoá bằng `normalizeText`. */
  query: string;
  category: CategoryFilter;
  sort: SortKey;
}

// Collator dùng lại cho mọi lần so sánh; tương đương `localeCompare(_, 'vi')` nhưng không dựng lại locale mỗi lần.
const viCollator = new Intl.Collator('vi');

/** Lọc rồi sắp xếp. Luôn trả mảng mới, không đụng vào `products`. Hoà thì xếp theo `id`. */
export function filterAndSortProducts(products: readonly Product[], { query, category, sort }: ProductFilter): Product[] {
  perfCount('filterSort');

  // Không dựng RegExp từ input: tìm bằng includes trên chuỗi đã chuẩn hoá.
  const result = products.filter(
    (product) => (category === 'all' || product.category === category) && normalizeText(product.name).includes(query),
  );

  switch (sort) {
    case 'name-asc':
      return result.sort((a, b) => viCollator.compare(a.name, b.name) || a.id - b.id);
    case 'name-desc':
      return result.sort((a, b) => viCollator.compare(b.name, a.name) || a.id - b.id);
    case 'price-asc':
      return result.sort((a, b) => a.price - b.price || a.id - b.id);
    case 'price-desc':
      return result.sort((a, b) => b.price - a.price || a.id - b.id);
    case 'none':
      return result;
  }
}

/** Bấm lần đầu: tăng dần; bấm lại cùng cột: đảo chiều; đổi cột: tăng dần. */
export function toggleSort(current: SortKey, field: SortField): SortKey {
  if (field === 'name') return current === 'name-asc' ? 'name-desc' : 'name-asc';
  return current === 'price-asc' ? 'price-desc' : 'price-asc';
}

export function ariaSortFor(sort: SortKey, field: SortField): AriaAttributes['aria-sort'] {
  if (sort === `${field}-asc`) return 'ascending';
  if (sort === `${field}-desc`) return 'descending';
  return 'none';
}
