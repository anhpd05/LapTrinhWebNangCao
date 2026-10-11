import { setupStore } from '../../app/store'
import { sampleProducts } from '../../test/fixtures'
import cartReducer, {
  addToCart,
  clearCart,
  removeFromCart,
  selectCartTotalPrice,
  selectCartTotalQuantity,
  updateQuantity,
} from './cartSlice'
import type { CartState } from './cartSlice'

const [mascara, palette] = sampleProducts

const stateWith = (...quantities: number[]): CartState => ({
  items: quantities.map((quantity, index) => ({
    ...sampleProducts[index],
    quantity,
  })),
})

describe('cartSlice selectors', () => {
  it('selectCartTotalQuantity cộng đúng số lượng các sản phẩm', () => {
    const state = setupStore({ cart: stateWith(2, 3) }).getState()
    expect(selectCartTotalQuantity(state)).toBe(5)
  })

  it('selectCartTotalPrice bằng tổng của giá nhân số lượng', () => {
    const state = setupStore({ cart: stateWith(2, 3) }).getState()
    expect(selectCartTotalPrice(state)).toBeCloseTo(
      mascara.price * 2 + palette.price * 3,
    )
  })
})

describe('cartSlice reducer', () => {
  it('addToCart thêm sản phẩm mới với quantity là 1', () => {
    const next = cartReducer({ items: [] }, addToCart(mascara))
    expect(next.items).toEqual([{ ...mascara, quantity: 1 }])
  })

  it('addToCart tăng quantity khi sản phẩm đã có và giữ nguyên độ dài mảng', () => {
    const next = cartReducer(stateWith(1), addToCart(mascara))
    expect(next.items).toHaveLength(1)
    expect(next.items[0].quantity).toBe(2)
  })

  it('removeFromCart chỉ xoá đúng id', () => {
    const next = cartReducer(stateWith(1, 1), removeFromCart(mascara.id))
    expect(next.items.map((item) => item.id)).toEqual([palette.id])
  })

  it('updateQuantity cập nhật số lượng khi nhận số dương', () => {
    const next = cartReducer(
      stateWith(1),
      updateQuantity({ id: mascara.id, quantity: 7 }),
    )
    expect(next.items[0].quantity).toBe(7)
  })

  it('updateQuantity xoá sản phẩm khi số lượng nhỏ hơn hoặc bằng 0', () => {
    const zero = cartReducer(
      stateWith(1, 1),
      updateQuantity({ id: mascara.id, quantity: 0 }),
    )
    expect(zero.items.map((item) => item.id)).toEqual([palette.id])

    const negative = cartReducer(
      stateWith(1),
      updateQuantity({ id: mascara.id, quantity: -2 }),
    )
    expect(negative.items).toEqual([])
  })

  it('updateQuantity bỏ qua id không có trong giỏ', () => {
    const state = stateWith(1)
    const next = cartReducer(state, updateQuantity({ id: 999, quantity: 5 }))
    expect(next).toEqual(state)
  })

  it('clearCart làm giỏ hàng rỗng', () => {
    expect(cartReducer(stateWith(1, 2), clearCart()).items).toEqual([])
  })
})
