import { ProductCard } from './ProductCard'
import type { Product } from './product.types'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

/** Dùng chung cho cả hai nguồn dữ liệu, nên nhận trạng thái qua props thay vì đọc store. */
export function ProductGrid({
  products,
  isLoading,
  error,
  onRetry,
}: ProductGridProps) {
  if (isLoading) {
    return <p className="state state--loading">Đang tải sản phẩm…</p>
  }

  if (error) {
    return (
      <div className="state state--error">
        <p>{error}</p>
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return <p className="state">Không có sản phẩm nào.</p>
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
