import type { Product } from '../types/product.types'

export const products: Product[] = Array.from({ length: 23 }, (_, i) => {
  const index = i + 1
  return {
    id: `p${index}`,
    name: `Sản phẩm ${index}`,
    price: 50000 + index * 10000,
    category: index % 2 === 0 ? 'Đồ điện tử' : 'Gia dụng',
  }
})
