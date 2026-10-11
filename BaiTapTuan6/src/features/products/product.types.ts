export interface Product {
  id: number
  title: string
  price: number
  thumbnail: string
  category: string
  stock: number
}

/** Shape thô mà GET https://dummyjson.com/products trả về. */
export interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}
