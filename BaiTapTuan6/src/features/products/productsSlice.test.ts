import { setupStore } from '../../app/store'
import { sampleProducts } from '../../test/fixtures'
import { PRODUCTS_QUERY } from './products.constants'
import productsReducer, { fetchProducts } from './productsSlice'

const originalFetch = globalThis.fetch
const mockFetch = () => {
  const fetchMock = jest.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

afterEach(() => {
  globalThis.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('fetchProducts (API mock)', () => {
  it('lưu danh sách sản phẩm và đặt status succeeded khi API thành công', async () => {
    const fetchMock = mockFetch().mockResolvedValue({
      ok: true,
      json: async () => ({ products: sampleProducts }),
    })
    const store = setupStore()

    await store.dispatch(fetchProducts())

    expect(store.getState().products).toEqual({
      items: sampleProducts,
      status: 'succeeded',
      error: null,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain(PRODUCTS_QUERY)
  })

  it('đặt status failed kèm mã lỗi khi máy chủ trả về HTTP lỗi', async () => {
    mockFetch().mockResolvedValue({ ok: false, status: 500 })
    const store = setupStore()

    await store.dispatch(fetchProducts())

    expect(store.getState().products.status).toBe('failed')
    expect(store.getState().products.error).toBe('Máy chủ trả về mã lỗi 500')
  })

  it('báo lỗi kết nối khi fetch bị reject', async () => {
    mockFetch().mockRejectedValue(new TypeError('Network down'))
    const store = setupStore()

    await store.dispatch(fetchProducts())

    expect(store.getState().products.status).toBe('failed')
    expect(store.getState().products.error).toBe(
      'Không kết nối được tới máy chủ sản phẩm',
    )
  })

  it('chuyển sang status loading khi thunk pending và xoá lỗi cũ', () => {
    const previous = {
      items: [],
      status: 'failed' as const,
      error: 'lỗi cũ',
    }
    const next = productsReducer(previous, fetchProducts.pending('req-1'))
    expect(next.status).toBe('loading')
    expect(next.error).toBeNull()
  })

  it('dùng thông điệp mặc định khi rejected không có payload', () => {
    const next = productsReducer(
      { items: [], status: 'loading', error: null },
      fetchProducts.rejected(new Error('x'), 'req-1'),
    )
    expect(next.error).toBe('Tải danh sách sản phẩm thất bại')
  })
})
