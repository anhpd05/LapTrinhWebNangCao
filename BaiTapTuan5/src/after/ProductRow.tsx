import { memo } from 'react';
import type { Product } from '../shared/types/product';
import { perfCount } from '../shared/perf/perf';
import { formatCurrency } from '../shared/utils/format-currency';
import { formatDate } from '../shared/utils/format-date';

interface Props { product: Product; rowIndex: number; top: number; onEdit: (product: Product) => void; onDelete: (id: number) => void }
export const ProductRow = memo(function ProductRow({ product, rowIndex, top, onEdit, onDelete }: Props) {
  perfCount('rowRender');
  return (
    <div role="row" aria-rowindex={rowIndex + 2} className="product-grid product-row virtual-row" style={{ transform: `translateY(${top}px)` }} data-row-id={product.id} data-price={product.price} data-name={product.name}>
      <div role="cell" className="cell cell--num">{product.id}</div>
      <div role="cell" className="cell">{product.name}</div>
      <div role="cell" className="cell">{product.category}</div>
      <div role="cell" className="cell cell--num">{formatCurrency(product.price)}</div>
      <div role="cell" className="cell cell--num">{product.stock}</div>
      <div role="cell" className="cell">{formatDate(product.createdAt)}</div>
      <div role="cell" className="cell cell--actions"><button type="button" className="btn btn--ghost btn--sm" data-action="edit" aria-label={`Sửa ${product.name}`} onClick={() => onEdit(product)}>Sửa</button><button type="button" className="btn btn--danger btn--sm" data-action="delete" aria-label={`Xoá ${product.name}`} onClick={() => onDelete(product.id)}>Xoá</button></div>
    </div>
  );
});
