export type ProductColumnKey = 'id' | 'name' | 'category' | 'price' | 'stock' | 'createdAt' | 'actions';

export interface ProductColumn {
  key: ProductColumnKey;
  label: string;
  numeric: boolean;
}

/** Bảy cột của bảng sản phẩm, dùng chung cho `<table>` (before) và div grid (after). */
export const PRODUCT_COLUMNS: readonly ProductColumn[] = [
  { key: 'id', label: 'ID', numeric: true },
  { key: 'name', label: 'Tên sản phẩm', numeric: false },
  { key: 'category', label: 'Danh mục', numeric: false },
  { key: 'price', label: 'Giá', numeric: true },
  { key: 'stock', label: 'Tồn kho', numeric: true },
  { key: 'createdAt', label: 'Ngày tạo', numeric: false },
  { key: 'actions', label: 'Thao tác', numeric: false },
];

export const PRODUCT_TABLE_LABEL = 'Danh sách sản phẩm';

export const EMPTY_PRODUCTS_TEXT = 'Không có sản phẩm';
