import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIES, type Category, type Product } from '../types/product';
import { formatCurrency } from '../utils/format-currency';

interface StatsChartProps {
  products: readonly Product[];
}

interface CategoryStat {
  category: string;
  products: number;
  stock: number;
  value: number;
}

const compactNumber = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });
const fullNumber = new Intl.NumberFormat('vi-VN');

function aggregate(products: readonly Product[]): CategoryStat[] {
  const byCategory = Object.fromEntries(
    CATEGORIES.map((category) => [category, { category, products: 0, stock: 0, value: 0 }]),
  ) as Record<Category, CategoryStat>;
  for (const product of products) {
    const stat = byCategory[product.category];
    stat.products += 1;
    stat.stock += product.stock;
    stat.value += product.price * product.stock;
  }
  return CATEGORIES.map((category) => byCategory[category]);
}

/** Tổng số lượng và giá trị tồn kho theo danh mục. Tổng số liệu cũng được phơi ra bằng data-* và bảng tóm tắt. */
export default function StatsChart({ products }: StatsChartProps) {
  const stats = useMemo(() => aggregate(products), [products]);
  const totalStock = stats.reduce((sum, stat) => sum + stat.stock, 0);
  const totalValue = stats.reduce((sum, stat) => sum + stat.value, 0);
  const hasData = products.length > 0;

  return (
    <section className="stats" aria-labelledby="stats-title">
      <h2 id="stats-title">Tồn kho theo danh mục</h2>

      <div
        id="stats-chart"
        className="stats-chart"
        data-total-stock={totalStock}
        data-total-value={totalValue}
        data-product-count={products.length}
        aria-hidden={hasData ? true : undefined}
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6dfeb" />
              <XAxis dataKey="category" interval={0} angle={-30} textAnchor="end" height={72} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="stock" tick={{ fontSize: 12 }} tickFormatter={(value: number) => compactNumber.format(value)} />
              <YAxis
                yAxisId="value"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => compactNumber.format(value)}
              />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar yAxisId="stock" dataKey="stock" name="Số lượng tồn" fill="#2563eb" isAnimationActive={false} />
              <Bar yAxisId="value" dataKey="value" name="Giá trị tồn kho (VND)" fill="#334155" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="stats-empty">Không có dữ liệu</p>
        )}
      </div>

      <div className="stats-summary-wrap">
        <table id="stats-summary" className="stats-summary">
          <caption className="sr-only">Số lượng và giá trị tồn kho theo danh mục</caption>
          <thead>
            <tr>
              <th scope="col">Danh mục</th>
              <th scope="col" className="num">Sản phẩm</th>
              <th scope="col" className="num">Số lượng tồn</th>
              <th scope="col" className="num">Giá trị tồn kho</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.category} data-category={stat.category} data-products={stat.products} data-stock={stat.stock} data-value={stat.value}>
                <th scope="row">{stat.category}</th>
                <td className="num">{fullNumber.format(stat.products)}</td>
                <td className="num">{fullNumber.format(stat.stock)}</td>
                <td className="num">{formatCurrency(stat.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr data-total="true" data-products={products.length} data-stock={totalStock} data-value={totalValue}>
              <th scope="row">Tổng</th>
              <td className="num">{fullNumber.format(products.length)}</td>
              <td className="num">{fullNumber.format(totalStock)}</td>
              <td className="num">{formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
