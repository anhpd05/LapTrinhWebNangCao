import { useState } from 'react';
// NAIVE: import tĩnh, Recharts và form sửa nằm trong bundle ban đầu.
import EditProductForm from '../shared/components/EditProductForm';
import { PageHeader } from '../shared/components/PageHeader';
import StatsChart from '../shared/components/StatsChart';
import { TabPanel, Toolbar, type Tab } from '../shared/components/Toolbar';
import { DEFAULT_SEED, generateProducts } from '../shared/data/generateProducts';
import { filterAndSortProducts, toggleSort } from '../shared/data/filterAndSortProducts';
import type { CategoryFilter, Product, SortKey } from '../shared/types/product';
import { checksum } from '../shared/utils/checksum';
import { normalizeText } from '../shared/utils/normalize-text';
import { parseN } from '../shared/utils/parse-n';
import { ProductTable } from './ProductTable';

export default function App() {
  const n = parseN(window.location.search);

  // NAIVE: không dùng lazy initializer, nên generateProducts(n) chạy lại ở mỗi lần render.
  const [products, setProducts] = useState(generateProducts(n, DEFAULT_SEED));
  // Checksum của dữ liệu ban đầu, tính một lần.
  const [initialChecksum] = useState(() => checksum(products, { n, seed: DEFAULT_SEED }));

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortKey>('none');
  const [tab, setTab] = useState<Tab>('table');
  const [editing, setEditing] = useState<Product | null>(null);
  // Tăng cùng commit với mỗi thay đổi làm đổi danh sách hiển thị; script đo dùng để chờ cập nhật.
  const [revision, setRevision] = useState(0);

  // NAIVE: lọc và sắp xếp ngay trong thân component, chạy lại ở mỗi lần render.
  const query = normalizeText(search);
  const visible = filterAndSortProducts(products, { query, category, sort });

  return (
    <main
      id="app"
      className="app"
      data-page="before"
      data-build-mode={import.meta.env.MODE}
      data-n={n}
      data-checksum={initialChecksum}
    >
      <PageHeader page="before" n={n} />

      <Toolbar
        // NAIVE: `search` cập nhật theo từng phím gõ, không trì hoãn.
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setRevision(revision + 1);
        }}
        onCategoryChange={(value) => {
          setCategory(value);
          setRevision(revision + 1);
        }}
        tab={tab}
        onTabChange={setTab}
        applied={{ query, category, sort, count: visible.length, revision }}
      />

      <TabPanel tab={tab}>
        {tab === 'table' ? (
          <ProductTable
            products={visible}
            sort={sort}
            // NAIVE: hàm xử lý viết inline, đổi identity ở mỗi lần render.
            onSort={(field) => {
              setSort(toggleSort(sort, field));
              setRevision(revision + 1);
            }}
            onEdit={(product) => setEditing(product)}
            onDelete={(id) => {
              setProducts(products.filter((product) => product.id !== id));
              setRevision(revision + 1);
            }}
          />
        ) : (
          <StatsChart products={visible} />
        )}
      </TabPanel>

      {editing && (
        <EditProductForm
          key={editing.id}
          product={editing}
          onCancel={() => setEditing(null)}
          onSave={(updated) => {
            setProducts(products.map((product) => (product.id === updated.id ? updated : product)));
            setEditing(null);
            setRevision(revision + 1);
          }}
        />
      )}
    </main>
  );
}
