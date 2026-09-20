import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatCurrency } from '../../utils/format-currency'
import { CartItemRow } from './CartItemRow'
import {
  clearCart,
  selectCartItems,
  selectCartTotalPrice,
  selectCartTotalQuantity,
} from './cartSlice'

export function CartPanel() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const totalQuantity = useAppSelector(selectCartTotalQuantity)
  const totalPrice = useAppSelector(selectCartTotalPrice)

  return (
    <aside className="cart">
      <header className="cart__header">
        <h2>Giỏ hàng</h2>
        <span className="cart__count">{totalQuantity} sản phẩm</span>
      </header>

      {items.length === 0 ? (
        <p className="state">Giỏ hàng đang trống.</p>
      ) : (
        <>
          <ul className="cart__list">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </ul>

          <footer className="cart__footer">
            <div className="cart__total">
              <span>Tổng cộng</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
            <button
              type="button"
              className="cart__clear"
              onClick={() => dispatch(clearCart())}
            >
              Xoá toàn bộ giỏ
            </button>
          </footer>
        </>
      )}
    </aside>
  )
}
