import { combineReducers, configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice'
import productsReducer from '../features/products/productsSlice'
import { productsApi } from '../features/products/productsApi'

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productsReducer,
  [productsApi.reducerPath]: productsApi.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    // Bắt buộc có để RTK Query chạy được caching và invalidation.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(productsApi.middleware),
    preloadedState,
  })
}

export const store = setupStore()

export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
