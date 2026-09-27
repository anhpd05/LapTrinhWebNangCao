const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

/** dummyjson.com trả giá theo USD. */
export const formatCurrency = (value: number) => formatter.format(value)
