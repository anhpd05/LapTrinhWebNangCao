import { create } from 'zustand'
import type { Product } from '../products/product.types'

interface FavoritesState {
  // Lưu nguyên Product để panel khỏi tra ngược sang Redux, đổi lại là dữ liệu snapshot lúc bấm thích
  items: Product[]
  toggleFavorite: (product: Product) => void
  removeFavorite: (id: number) => void
}

export const useFavoritesStore = create<FavoritesState>()((set) => ({
  items: [],
  toggleFavorite: (product) =>
    set((state) => ({
      items: state.items.some((item) => item.id === product.id)
        ? state.items.filter((item) => item.id !== product.id)
        : [...state.items, product],
    })),
  removeFavorite: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))
