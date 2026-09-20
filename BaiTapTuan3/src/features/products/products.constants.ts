export const PRODUCTS_API_BASE_URL = 'https://dummyjson.com'

export const PRODUCTS_LIMIT = 12

export const PRODUCTS_SELECT = 'id,title,price,thumbnail,category,stock'

export const PRODUCTS_QUERY = `/products?limit=${PRODUCTS_LIMIT}&select=${PRODUCTS_SELECT}`
