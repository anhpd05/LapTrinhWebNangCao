import { useAppDispatch } from '../../app/hooks'
import { formatCurrency } from '../../utils/format-currency'
import { removeFromCart, updateQuantity } from './cartSlice'
import type { CartItem } from './cart.types'

interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const dispatch = useAppDispatch()

  return (
    <li className="cart-item">
      <img className="cart-item__image" src={item.thumbnail} alt={item.title} />

      <div className="cart-item__info">
        <p className="cart-item__title">{item.title}</p>
        <span className="cart-item__price">
          {formatCurrency(item.price)} / sản phẩm
        </span>
      </div>

      <div className="cart-item__quantity">
        <button
          type="button"
          aria-label={`Giảm số lượng ${item.title}`}
          onClick={() =>
            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
          }
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={item.quantity}
          aria-label={`Số lượng ${item.title}`}
          onChange={(event) =>
            dispatch(
              updateQuantity({
                id: item.id,
                quantity: Number(event.target.value),
              }),
            )
          }
        />
        <button
          type="button"
          aria-label={`Tăng số lượng ${item.title}`}
          onClick={() =>
            dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
          }
        >
          +
        </button>
      </div>

      <strong className="cart-item__subtotal">
        {formatCurrency(item.price * item.quantity)}
      </strong>

      <button
        type="button"
        className="cart-item__remove"
        aria-label={`Xoá ${item.title} khỏi giỏ`}
        onClick={() => dispatch(removeFromCart(item.id))}
      >
        ✕
      </button>
    </li>
  )
}
