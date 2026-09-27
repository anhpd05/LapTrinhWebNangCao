import { formatCurrency } from '../../utils/format-currency'
import type { Product } from '../products/product.types'
import { useFavoritesStore } from './favoritesStore'

interface FavoriteItemRowProps {
  item: Product
}

export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite)

  return (
    <li className="favorite-item">
      <img
        className="favorite-item__image"
        src={item.thumbnail}
        alt={item.title}
      />

      <div className="favorite-item__info">
        <p className="favorite-item__title" title={item.title}>
          {item.title}
        </p>
        <span className="favorite-item__price">
          {formatCurrency(item.price)}
        </span>
      </div>

      <button
        type="button"
        className="favorite-item__remove"
        aria-label={`Bỏ ${item.title} khỏi yêu thích`}
        onClick={() => removeFavorite(item.id)}
      >
        ✕
      </button>
    </li>
  )
}
