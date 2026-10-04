import { perfCount } from '../shared/perf/perf';
import type { Product } from '../shared/types/product';
import { formatCurrency } from '../shared/utils/format-currency';
import { formatDate } from '../shared/utils/format-date';

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

// NAIVE: không bọc `memo`, nên mọi dòng render lại mỗi khi App render.
export function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
  perfCount('rowRender');

  return (
    <tr className="product-row" data-row-id={product.id} data-price={product.price} data-name={product.name}>
      <td className="cell cell--num">{product.id}</td>
      <td className="cell">{product.name}</td>
      <td className="cell">{product.category}</td>
      <td className="cell cell--num">{formatCurrency(product.price)}</td>
      <td className="cell cell--num">{product.stock}</td>
      <td className="cell">{formatDate(product.createdAt)}</td>
      <td className="cell cell--actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          data-action="edit"
          aria-label={`Sửa ${product.name}`}
          onClick={() => onEdit(product)}
        >
          Sửa
        </button>
        <button
          type="button"
          className="btn btn--danger btn--sm"
          data-action="delete"
          aria-label={`Xoá ${product.name}`}
          onClick={() => onDelete(product.id)}
        >
          Xoá
        </button>
      </td>
    </tr>
  );
}
