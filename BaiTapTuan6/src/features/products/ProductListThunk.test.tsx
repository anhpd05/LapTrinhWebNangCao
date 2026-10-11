import { screen } from '@testing-library/react'
import { sampleProducts } from '../../test/fixtures'
import { renderWithStore } from '../../test/render-with-store'
import { ProductListThunk } from './ProductListThunk'

const originalFetch = globalThis.fetch
const mockFetch = () => {
  const fetchMock = jest.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}
const okResponse = {
  ok: true,
  json: async () => ({ products: sampleProducts }),
}

afterEach(() => {
  globalThis.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('ProductListThunk (API mock)', () => {
  it('hiện trạng thái đang tải rồi hiện danh sách khi API thành công', async () => {
    mockFetch().mockResolvedValue(okResponse)
    renderWithStore(<ProductListThunk />)

    expect(screen.getByText('Đang tải sản phẩm…')).toBeInTheDocument()
    expect(await screen.findByText(sampleProducts[0].title)).toBeInTheDocument()
    expect(screen.getByText(sampleProducts[1].title)).toBeInTheDocument()
    expect(screen.queryByText('Đang tải sản phẩm…')).not.toBeInTheDocument()
  })

  it('hiện lỗi và nút Thử lại; bấm Thử lại thì gọi API lần nữa và hiện sản phẩm', async () => {
    const fetchMock = mockFetch()
      .mockRejectedValueOnce(new TypeError('Network down'))
      .mockResolvedValueOnce(okResponse)
    const { user } = renderWithStore(<ProductListThunk />)

    expect(
      await screen.findByText('Không kết nối được tới máy chủ sản phẩm'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText(sampleProducts[0].title)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('hiện thông báo khi API trả về danh sách rỗng', async () => {
    mockFetch().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [] }),
    })
    renderWithStore(<ProductListThunk />)

    expect(await screen.findByText('Không có sản phẩm nào.')).toBeInTheDocument()
  })
})
