import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatCurrency } from '../../utils/format-currency'
import { addToCart, selectCartItems } from '../cart/cartSlice'
import type { Product } from './product.types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const quantityInCart = useAppSelector(
    (state) =>
      selectCartItems(state).find((item) => item.id === product.id)?.quantity ??
      0,
  )

  return (
    <article className="product-card">
      <img
        className="product-card__image"
        src={product.thumbnail}
        alt={product.title}
        loading="lazy"
      />
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__title">{product.title}</h3>
        <strong className="product-card__price">
          {formatCurrency(product.price)}
        </strong>
      </div>
      <button
        type="button"
        className="product-card__action"
        onClick={() => dispatch(addToCart(product))}
      >
        Thêm vào giỏ
        {quantityInCart > 0 && (
          <span className="product-card__badge">{quantityInCart}</span>
        )}
      </button>
    </article>
  )
}
