import { ProductGrid } from './ProductGrid'
import { useGetProductsQuery } from './productsApi'

export function ProductListQuery() {
  const { data, isLoading, isError, refetch } = useGetProductsQuery()

  return (
    <ProductGrid
      products={data ?? []}
      isLoading={isLoading}
      error={isError ? 'Tải danh sách sản phẩm qua RTK Query thất bại' : null}
      onRetry={() => void refetch()}
    />
  )
}
