import { FavoriteItemRow } from './FavoriteItemRow'
import { useFavoritesStore } from './favoritesStore'

export function FavoritesPanel() {
  const items = useFavoritesStore((state) => state.items)

  return (
    <aside className="favorites">
      <header className="favorites__header">
        <h2>Yêu thích</h2>
        <span className="favorites__count">{items.length} sản phẩm</span>
      </header>

      {items.length === 0 ? (
        <p className="state">
          Chưa có sản phẩm yêu thích. Bấm biểu tượng trái tim trên sản phẩm để
          lưu lại.
        </p>
      ) : (
        <ul className="favorites__list">
          {items.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </aside>
  )
}
