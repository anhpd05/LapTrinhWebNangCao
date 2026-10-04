import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortButton } from '../shared/components/SortButton';
import { ariaSortFor } from '../shared/data/filterAndSortProducts';
import type { ProductFilter } from '../shared/data/filterAndSortProducts';
import { EMPTY_PRODUCTS_TEXT, PRODUCT_COLUMNS, PRODUCT_TABLE_LABEL } from '../shared/data/columns';
import type { Product, SortField, SortKey } from '../shared/types/product';
import { ProductRow } from './ProductRow';

interface Props { products: Product[]; applied: ProductFilter; sort: SortKey; onSort: (field: SortField) => void; onEdit: (product: Product) => void; onDelete: (id: number) => void }
export function VirtualProductTable({ products, applied, sort, onSort, onEdit, onDelete }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: products.length, getScrollElement: () => scrollRef.current,
    estimateSize: () => 44, overscan: 10, getItemKey: index => products[index].id,
    scrollMargin: 44,
  });
  useEffect(() => { virtualizer.scrollToOffset(0); }, [applied, virtualizer]);
  return (
    <div id="product-table" ref={scrollRef} className="table-viewport" role="table" aria-label={PRODUCT_TABLE_LABEL} aria-rowcount={products.length + 1} aria-colcount={7} tabIndex={0}>
      <div role="rowgroup" className="grid-header"><div role="row" aria-rowindex={1} className="product-grid">
        {PRODUCT_COLUMNS.map(column => <div key={column.key} role="columnheader" className={`cell cell--head${column.numeric ? ' cell--num' : ''}`} aria-sort={column.key === 'name' || column.key === 'price' ? ariaSortFor(sort, column.key) : undefined}>
          {column.key === 'name' || column.key === 'price' ? <SortButton id={`sort-${column.key}`} label={column.label} field={column.key} sort={sort} onSort={onSort} /> : column.label}
        </div>)}
      </div></div>
      {products.length === 0 ? <div className="empty-state">{EMPTY_PRODUCTS_TEXT}</div> : <div role="rowgroup" className="virtual-body" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => <ProductRow key={item.key} product={products[item.index]} rowIndex={item.index} top={item.start - 44} onEdit={onEdit} onDelete={onDelete} />)}
      </div>}
    </div>
  );
}
