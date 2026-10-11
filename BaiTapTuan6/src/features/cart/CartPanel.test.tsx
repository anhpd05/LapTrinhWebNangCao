import { screen, within } from '@testing-library/react'
import { sampleProducts } from '../../test/fixtures'
import { renderWithStore } from '../../test/render-with-store'
import { ProductCard } from '../products/ProductCard'
import { CartPanel } from './CartPanel'

const [mascara, palette] = sampleProducts

describe('CartPanel', () => {
  it('hiện thông báo khi giỏ hàng rỗng', () => {
    renderWithStore(<CartPanel />)

    expect(screen.getByText('Giỏ hàng đang trống.')).toBeInTheDocument()
    expect(screen.getByText('0 sản phẩm')).toBeInTheDocument()
  })

  it('đồng bộ giữa ProductCard và CartPanel dùng chung một store', async () => {
    const { user } = renderWithStore(
      <>
        <ProductCard product={mascara} />
        <CartPanel />
      </>,
    )
    const addButton = screen.getByRole('button', { name: /Thêm vào giỏ/ })

    await user.click(addButton)
    await user.click(addButton)

    expect(within(addButton).getByText('2')).toBeInTheDocument()
    expect(screen.getByText('2 sản phẩm')).toBeInTheDocument()
    expect(screen.getByText('Tổng cộng').parentElement).toHaveTextContent(
      '$19.98',
    )
  })

  it('tăng, giảm, xoá từng sản phẩm và xoá toàn bộ giỏ cập nhật đúng UI', async () => {
    const { user } = renderWithStore(<CartPanel />, {
      preloadedState: {
        cart: {
          items: [
            { ...mascara, quantity: 1 },
            { ...palette, quantity: 2 },
          ],
        },
      },
    })
    const quantityInput = (title: string) =>
      screen.getByRole('spinbutton', { name: `Số lượng ${title}` })

    await user.click(
      screen.getByRole('button', { name: `Tăng số lượng ${mascara.title}` }),
    )
    expect(quantityInput(mascara.title)).toHaveValue(2)
    expect(screen.getByText('4 sản phẩm')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: `Giảm số lượng ${palette.title}` }),
    )
    expect(quantityInput(palette.title)).toHaveValue(1)

    await user.click(
      screen.getByRole('button', { name: `Xoá ${mascara.title} khỏi giỏ` }),
    )
    expect(
      screen.queryByRole('spinbutton', { name: `Số lượng ${mascara.title}` }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('1 sản phẩm')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xoá toàn bộ giỏ' }))
    expect(screen.getByText('Giỏ hàng đang trống.')).toBeInTheDocument()
  })

  it('giảm số lượng về 0 thì sản phẩm biến mất khỏi giỏ', async () => {
    const { user } = renderWithStore(<CartPanel />, {
      preloadedState: { cart: { items: [{ ...mascara, quantity: 1 }] } },
    })

    await user.click(
      screen.getByRole('button', { name: `Giảm số lượng ${mascara.title}` }),
    )

    expect(screen.getByText('Giỏ hàng đang trống.')).toBeInTheDocument()
  })

  it('nhập số lượng trực tiếp vào ô input cập nhật giỏ', async () => {
    const { user } = renderWithStore(<CartPanel />, {
      preloadedState: { cart: { items: [{ ...mascara, quantity: 1 }] } },
    })
    const input = screen.getByRole('spinbutton', {
      name: `Số lượng ${mascara.title}`,
    })

    // Ô số lượng là input điều khiển, nên gõ thêm chữ số vào cuối giá trị hiện tại.
    await user.type(input, '5')

    expect(screen.getByText('15 sản phẩm')).toBeInTheDocument()
  })

  it('xoá trắng ô số lượng thì sản phẩm bị xoá khỏi giỏ', async () => {
    const { user } = renderWithStore(<CartPanel />, {
      preloadedState: { cart: { items: [{ ...mascara, quantity: 3 }] } },
    })

    await user.clear(
      screen.getByRole('spinbutton', { name: `Số lượng ${mascara.title}` }),
    )

    expect(screen.getByText('Giỏ hàng đang trống.')).toBeInTheDocument()
  })
})
