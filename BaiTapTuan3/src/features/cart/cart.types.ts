import type { Product } from '../products/product.types'

export interface CartItem extends Product {
  quantity: number
}
