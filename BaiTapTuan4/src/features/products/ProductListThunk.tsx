import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { ProductGrid } from './ProductGrid'
import {
  fetchProducts,
  selectProducts,
  selectProductsError,
  selectProductsStatus,
} from './productsSlice'

export function ProductListThunk() {
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectProducts)
  const status = useAppSelector(selectProductsStatus)
  const error = useAppSelector(selectProductsError)

  useEffect(() => {
    // Chỉ gọi khi chưa từng tải, tránh fetch lại mỗi lần component mount.
    if (status === 'idle') {
      dispatch(fetchProducts())
    }
  }, [dispatch, status])

  return (
    <ProductGrid
      products={products}
      isLoading={status === 'loading'}
      error={error}
      onRetry={() => dispatch(fetchProducts())}
    />
  )
}
