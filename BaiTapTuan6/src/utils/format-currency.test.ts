import { formatCurrency } from './format-currency'

describe('formatCurrency', () => {
  it('định dạng số thành USD với hai chữ số thập phân', () => {
    expect(formatCurrency(19.99)).toBe('$19.99')
    expect(formatCurrency(0)).toBe('$0.00')
  })
})
