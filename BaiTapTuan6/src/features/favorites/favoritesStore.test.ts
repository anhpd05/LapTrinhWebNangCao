import { act, renderHook } from '@testing-library/react'
import { sampleProducts } from '../../test/fixtures'
import { useFavoritesStore } from './favoritesStore'

const [mascara, palette] = sampleProducts

beforeEach(() => {
  useFavoritesStore.setState({ items: [] })
})

describe('useFavoritesStore', () => {
  it('toggleFavorite lần 1 thì thêm, lần 2 thì bỏ', () => {
    const { result } = renderHook(() => useFavoritesStore())

    act(() => result.current.toggleFavorite(mascara))
    expect(result.current.items).toEqual([mascara])

    act(() => result.current.toggleFavorite(mascara))
    expect(result.current.items).toEqual([])
  })

  it('removeFavorite chỉ xoá đúng sản phẩm theo id', () => {
    const { result } = renderHook(() => useFavoritesStore())

    act(() => {
      result.current.toggleFavorite(mascara)
      result.current.toggleFavorite(palette)
    })
    act(() => result.current.removeFavorite(mascara.id))

    expect(result.current.items).toEqual([palette])
  })
})
