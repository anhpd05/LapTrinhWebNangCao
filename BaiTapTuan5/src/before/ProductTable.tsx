import { SortButton } from '../shared/components/SortButton';
import { ariaSortFor } from '../shared/data/filterAndSortProducts';
import { EMPTY_PRODUCTS_TEXT, PRODUCT_COLUMNS, PRODUCT_TABLE_LABEL } from '../shared/data/columns';
import type { Product, SortField, SortKey } from '../shared/types/product';
import { ProductRow } from './ProductRow';

interface ProductTableProps {
  products: Product[];
  sort: SortKey;
  onSort: (field: SortField) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ products, sort, onSort, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="table-viewport" role="region" aria-label={PRODUCT_TABLE_LABEL} tabIndex={0}>
      <table id="product-table" className="product-table">
        <caption className="sr-only">{PRODUCT_TABLE_LABEL}</caption>
        <thead>
          <tr>
            {PRODUCT_COLUMNS.map((column) => {
              const className = column.numeric ? 'cell cell--head cell--num' : 'cell cell--head';
              if (column.key === 'name' || column.key === 'price') {
                return (
                  <th key={column.key} scope="col" className={className} aria-sort={ariaSortFor(sort, column.key)}>
                    <SortButton id={`sort-${column.key}`} label={column.label} field={column.key} sort={sort} onSort={onSort} />
                  </th>
                );
              }
              return (
                <th key={column.key} scope="col" className={className}>
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={PRODUCT_COLUMNS.length} className="cell cell--empty">
                {EMPTY_PRODUCTS_TEXT}
              </td>
            </tr>
          ) : (
            // NAIVE: render toàn bộ các dòng, không ảo hoá.
            products.map((product) => (
              <ProductRow key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
