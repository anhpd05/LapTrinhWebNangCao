import type { KeyboardEvent, ReactNode } from 'react';
import { CATEGORIES, isCategoryFilter, type CategoryFilter, type SortKey } from '../types/product';

export type Tab = 'table' | 'stats';

/** Trạng thái đã áp dụng: giá trị mà danh sách đang hiển thị thực sự dựa vào. */
export interface AppliedState {
  /** Chuỗi tìm kiếm đã chuẩn hoá. */
  query: string;
  category: CategoryFilter;
  sort: SortKey;
  /** Số sản phẩm của danh sách đang hiển thị. */
  count: number;
  /** Tăng ở mỗi commit làm thay đổi danh sách đang hiển thị. */
  revision: number;
}

export interface ToolbarProps {
  /** Giá trị thô của ô tìm kiếm (chỉ dùng cho input). */
  search: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: CategoryFilter) => void;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  applied: AppliedState;
}

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'table', label: 'Bảng' },
  { id: 'stats', label: 'Thống kê' },
];

export function Toolbar({ search, onSearchChange, onCategoryChange, tab, onTabChange, applied }: ToolbarProps) {
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let next: Tab | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = tab === 'table' ? 'stats' : 'table';
    else if (event.key === 'Home') next = 'table';
    else if (event.key === 'End') next = 'stats';
    if (next === null) return;
    event.preventDefault();
    onTabChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <section className="toolbar" aria-label="Công cụ tìm kiếm và lọc">
      <div className="field field--search">
        <label htmlFor="search">Tìm sản phẩm</label>
        <input
          id="search"
          type="search"
          value={search}
          placeholder="Ví dụ: dien thoai"
          autoComplete="off"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="category-filter">Danh mục</label>
        <select
          id="category-filter"
          value={applied.category}
          onChange={(event) => {
            const { value } = event.target;
            if (isCategoryFilter(value)) onCategoryChange(value);
          }}
        >
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="tabs" role="tablist" aria-label="Chế độ xem">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === id}
            aria-controls={tab === id ? `panel-${id}` : undefined}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => onTabChange(id)}
            onKeyDown={handleTabKeyDown}
          >
            {label}
          </button>
        ))}
      </div>

      <p
        id="result-count"
        className="result-count"
        role="status"
        data-count={applied.count}
        data-query={applied.query}
        data-category={applied.category}
        data-sort={applied.sort}
        data-revision={applied.revision}
      >
        {applied.count.toLocaleString('vi-VN')} sản phẩm
      </p>
    </section>
  );
}

/** Vùng nội dung của tab đang chọn, khớp `aria-controls` / `aria-labelledby` của `Toolbar`. */
export function TabPanel({ tab, children }: { tab: Tab; children: ReactNode }) {
  return (
    <section id={`panel-${tab}`} className="panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {children}
    </section>
  );
}
