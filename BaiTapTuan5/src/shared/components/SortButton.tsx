import type { SortField, SortKey } from '../types/product';

export interface SortButtonProps {
  id: string;
  label: string;
  field: SortField;
  sort: SortKey;
  onSort: (field: SortField) => void;
}

/** Nút sắp xếp trong tiêu đề cột. Trạng thái sắp xếp do `aria-sort` của columnheader truyền tải. */
export function SortButton({ id, label, field, sort, onSort }: SortButtonProps) {
  let indicator = '↕';
  if (sort === `${field}-asc`) indicator = '▲';
  else if (sort === `${field}-desc`) indicator = '▼';

  return (
    <button type="button" id={id} className="sort-btn" onClick={() => onSort(field)}>
      {label}
      <span className="sort-indicator" aria-hidden="true">
        {indicator}
      </span>
    </button>
  );
}
