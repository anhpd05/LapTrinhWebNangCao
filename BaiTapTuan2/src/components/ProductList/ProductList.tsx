import { usePagination } from '../../hooks/usePagination'
import { products } from '../../data/products'
import type { Product } from '../../types/product.types'
import './ProductList.css'

const ITEMS_PER_PAGE = 5

export function ProductList() {
  const { currentPage, totalPages, currentItems, nextPage, prevPage, goToPage } =
    usePagination<Product>(products, ITEMS_PER_PAGE)

  return (
    <div className="product-list">
      <ul className="product-list__items">
        {currentItems.map((product) => (
          <li key={product.id} className="product-card">
            <span className="product-card__name">{product.name}</span>
            <span className="product-card__category">{product.category}</span>
            <span className="product-card__price">
              {product.price.toLocaleString('vi-VN')} đ
            </span>
          </li>
        ))}
      </ul>

      <div className="product-list__pagination">
        <button type="button" onClick={prevPage} disabled={currentPage === 1}>
          Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            className={page === currentPage ? 'page-button page-button--active' : 'page-button'}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        ))}

        <button type="button" onClick={nextPage} disabled={currentPage === totalPages}>
          Sau
        </button>
      </div>
    </div>
  )
}
