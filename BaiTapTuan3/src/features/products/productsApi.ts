import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { PRODUCTS_API_BASE_URL, PRODUCTS_QUERY } from './products.constants'
import type { Product, ProductsResponse } from './product.types'

/** Bản RTK Query của productsSlice: tự sinh reducer, middleware, hook và cache. */
export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRODUCTS_API_BASE_URL }),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => PRODUCTS_QUERY,
      transformResponse: (response: ProductsResponse) => response.products,
      providesTags: ['Products'],
    }),
  }),
})

export const { useGetProductsQuery } = productsApi
