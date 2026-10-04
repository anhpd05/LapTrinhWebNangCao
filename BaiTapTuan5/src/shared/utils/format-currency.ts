const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
