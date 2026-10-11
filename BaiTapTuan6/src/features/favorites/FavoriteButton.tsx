import type { Product } from '../products/product.types'
import { useFavoritesStore } from './favoritesStore'

interface FavoriteButtonProps {
  product: Product
}

export function FavoriteButton({ product }: FavoriteButtonProps) {
  // Selector trả về boolean nên chỉ thẻ vừa đổi trạng thái mới re-render
  const isFavorite = useFavoritesStore((state) =>
    state.items.some((item) => item.id === product.id),
  )
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

  return (
    <button
      type="button"
      className={`favorite-toggle${isFavorite ? ' is-active' : ''}`}
      aria-pressed={isFavorite}
      aria-label={`Yêu thích ${product.title}`}
      title={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
      onClick={() => toggleFavorite(product)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}
