import type { Product } from '../features/products/product.types'

export const sampleProducts: Product[] = [
  {
    id: 1,
    title: 'Essence Mascara',
    price: 9.99,
    thumbnail: 'https://example.test/mascara.png',
    category: 'beauty',
    stock: 5,
  },
  {
    id: 2,
    title: 'Eyeshadow Palette',
    price: 19.99,
    thumbnail: 'https://example.test/palette.png',
    category: 'beauty',
    stock: 44,
  },
  {
    id: 3,
    title: 'Red Lipstick',
    price: 12.5,
    thumbnail: 'https://example.test/lipstick.png',
    category: 'beauty',
    stock: 68,
  },
]
