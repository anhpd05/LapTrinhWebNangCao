import { Suspense, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { PageHeader } from '../shared/components/PageHeader';
import { TabPanel, Toolbar, type Tab } from '../shared/components/Toolbar';
import { DEFAULT_SEED, generateProducts } from '../shared/data/generateProducts';
import { filterAndSortProducts, toggleSort } from '../shared/data/filterAndSortProducts';
import type { Product, CategoryFilter, SortField, SortKey } from '../shared/types/product';
import { checksum } from '../shared/utils/checksum';
import { normalizeText } from '../shared/utils/normalize-text';
import { parseN } from '../shared/utils/parse-n';
import { LazyErrorBoundary } from './LazyErrorBoundary';
import { useRetryableLazy } from './useRetryableLazy';
import { VirtualProductTable } from './VirtualProductTable';

const loadStats = () => import('../shared/components/StatsChart');
const loadEdit = () => import('../shared/components/EditProductForm');
function StatsPanel({ products }: { products: Product[] }) {
  const { Component, attempt, retry } = useRetryableLazy(loadStats);
  return <LazyErrorBoundary resetKey={attempt} onRetry={retry}><Suspense fallback={<div role="status" className="stats" style={{ height: 320 }}>Đang tải biểu đồ…</div>}><Component products={products} /></Suspense></LazyErrorBoundary>;
}
function EditPanel({ product, onSave, onCancel }: { product: Product; onSave: (updated: Product) => void; onCancel: () => void }) {
  const { Component, attempt, retry } = useRetryableLazy(loadEdit);
  return <LazyErrorBoundary resetKey={attempt} onRetry={retry}><Suspense fallback={<p role="status">Đang tải form sửa…</p>}><Component product={product} onSave={onSave} onCancel={onCancel} /></Suspense></LazyErrorBoundary>;
}

export default function App() {
  const [n] = useState(() => parseN(window.location.search));
  const [products, setProducts] = useState(() => generateProducts(n, DEFAULT_SEED));
  const [initialChecksum] = useState(() => checksum(products, { n, seed: DEFAULT_SEED }));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortKey>('none');
  const [tab, setTab] = useState<Tab>('table');
  const [editing, setEditing] = useState<Product | null>(null);
  const deferredSearch = useDeferredValue(search);
  const applied = useMemo(() => ({ query: normalizeText(deferredSearch), category, sort }), [deferredSearch, category, sort]);
  const visible = useMemo(() => filterAndSortProducts(products, applied), [products, applied]);
  // Adjust before committing: revision and applied list never describe different commits.
  const [listCommit, setListCommit] = useState({ rows: visible, revision: 0 });
  if (listCommit.rows !== visible) setListCommit({ rows: visible, revision: listCommit.revision + 1 });
  const onSort = useCallback((field: SortField) => setSort(previous => toggleSort(previous, field)), []);
  const onEdit = useCallback((product: Product) => setEditing(product), []);
  const onDelete = useCallback((id: number) => setProducts(previous => previous.filter(product => product.id !== id)), []);
  const onCancel = useCallback(() => setEditing(null), []);
  const onSave = useCallback((updated: Product) => {
    setProducts(previous => previous.map(product => product.id === updated.id ? updated : product));
    setEditing(null);
  }, []);
  return (
    <main id="app" className="app" data-page="after" data-build-mode={import.meta.env.MODE} data-n={n} data-checksum={initialChecksum}>
      <PageHeader page="after" n={n} />
      <Toolbar search={search} onSearchChange={setSearch} onCategoryChange={setCategory} tab={tab} onTabChange={setTab} applied={{ ...applied, count: visible.length, revision: listCommit.revision }} />
      <TabPanel tab={tab}>{tab === 'table' ? <VirtualProductTable products={visible} applied={applied} sort={sort} onSort={onSort} onEdit={onEdit} onDelete={onDelete} /> : <StatsPanel products={visible} />}</TabPanel>
      {editing && <EditPanel key={editing.id} product={editing} onSave={onSave} onCancel={onCancel} />}
    </main>
  );
}
