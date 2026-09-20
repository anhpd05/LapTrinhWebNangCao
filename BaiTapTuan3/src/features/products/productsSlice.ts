import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { PRODUCTS_API_BASE_URL, PRODUCTS_QUERY } from './products.constants'
import type { Product, ProductsResponse } from './product.types'

export type ProductsStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface ProductsState {
  items: Product[]
  status: ProductsStatus
  error: string | null
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null,
}

/** rejectWithValue để reducer nhận đúng thông điệp lỗi thay vì Error mặc định. */
export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>('products/fetchProducts', async (_arg, { rejectWithValue }) => {
  try {
    const response = await fetch(`${PRODUCTS_API_BASE_URL}${PRODUCTS_QUERY}`)
    if (!response.ok) {
      return rejectWithValue(`Máy chủ trả về mã lỗi ${response.status}`)
    }
    const data = (await response.json()) as ProductsResponse
    return data.products
  } catch {
    return rejectWithValue('Không kết nối được tới máy chủ sản phẩm')
  }
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Tải danh sách sản phẩm thất bại'
      })
  },
})

export const selectProducts = (state: RootState) => state.products.items
export const selectProductsStatus = (state: RootState) => state.products.status
export const selectProductsError = (state: RootState) => state.products.error

export default productsSlice.reducer
