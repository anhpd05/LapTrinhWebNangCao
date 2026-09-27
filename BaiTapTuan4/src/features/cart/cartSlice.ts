import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { Product } from '../products/product.types'
import type { CartItem } from './cart.types'

export interface CartState {
  items: CartItem[]
}

const initialState: CartState = {
  items: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const existing = state.items.find((item) => item.id === action.payload.id)
      if (existing) {
        existing.quantity += 1
        return
      }
      state.items.push({ ...action.payload, quantity: 1 })
    },

    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },

    /** Số lượng về 0 hoặc âm đồng nghĩa với xoá sản phẩm khỏi giỏ. */
    updateQuantity(
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.id !== id)
        return
      }
      const existing = state.items.find((item) => item.id === id)
      if (existing) {
        existing.quantity = quantity
      }
    },

    clearCart(state) {
      state.items = []
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions

export const selectCartItems = (state: RootState) => state.cart.items

export const selectCartTotalQuantity = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.quantity, 0),
)

export const selectCartTotalPrice = createSelector([selectCartItems], (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

export default cartSlice.reducer
