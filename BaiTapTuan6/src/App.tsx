import { useState } from 'react'
import { CartPanel } from './features/cart/CartPanel'
import { FavoritesPanel } from './features/favorites/FavoritesPanel'
import { ProductListQuery } from './features/products/ProductListQuery'
import { ProductListThunk } from './features/products/ProductListThunk'
import './App.css'

type DataSource = 'thunk' | 'rtk-query'

function App() {
  const [source, setSource] = useState<DataSource>('thunk')

  return (
    <main className="page">
      <header className="page__header">
        <h1>Sản phẩm yêu thích với Zustand</h1>
        <p className="page__subtitle">
          Sản phẩm lấy từ dummyjson.com. Giỏ hàng quản lý bằng Redux Toolkit,
          danh sách yêu thích quản lý bằng Zustand.
        </p>
      </header>

      <section className="source-switch">
        <span className="source-switch__label">Nguồn dữ liệu sản phẩm</span>
        <div className="source-switch__options" role="group">
          <button
            type="button"
            className={source === 'thunk' ? 'is-active' : ''}
            onClick={() => setSource('thunk')}
          >
            createAsyncThunk
          </button>
          <button
            type="button"
            className={source === 'rtk-query' ? 'is-active' : ''}
            onClick={() => setSource('rtk-query')}
          >
            RTK Query
          </button>
        </div>
      </section>

      <div className="layout">
        <section className="layout__products">
          <h2>Sản phẩm</h2>
          {source === 'thunk' ? <ProductListThunk /> : <ProductListQuery />}
        </section>

        {/* tabIndex để người dùng bàn phím cuộn được sidebar khi nội dung dài hơn màn hình */}
        <div
          className="sidebar"
          role="region"
          aria-label="Yêu thích và giỏ hàng"
          tabIndex={0}
        >
          <FavoritesPanel />
          <CartPanel />
        </div>
      </div>
    </main>
  )
}

export default App
