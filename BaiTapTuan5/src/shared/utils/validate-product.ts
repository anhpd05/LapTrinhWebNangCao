export const PRODUCT_LIMITS = {
  nameMax: 120,
  priceMin: 1,
  priceMax: 100_000_000,
  stockMin: 0,
  stockMax: 1_000,
} as const;

export interface ProductDraft {
  name: string;
  price: number;
  stock: number;
}

export type ProductField = keyof ProductDraft;

export type ProductErrors = Partial<Record<ProductField, string>>;

/** Trả về map lỗi theo từng field; object rỗng nghĩa là hợp lệ. */
export function validateProduct(draft: ProductDraft): ProductErrors {
  const errors: ProductErrors = {};
  const name = draft.name.trim();

  if (name.length === 0) {
    errors.name = 'Tên sản phẩm không được để trống.';
  } else if (name.length > PRODUCT_LIMITS.nameMax) {
    errors.name = `Tên sản phẩm tối đa ${PRODUCT_LIMITS.nameMax} ký tự.`;
  }

  const { price, stock } = draft;
  if (!Number.isSafeInteger(price) || price < PRODUCT_LIMITS.priceMin || price > PRODUCT_LIMITS.priceMax) {
    errors.price = 'Giá phải là số nguyên từ 1 đến 100.000.000.';
  }

  if (!Number.isSafeInteger(stock) || stock < PRODUCT_LIMITS.stockMin || stock > PRODUCT_LIMITS.stockMax) {
    errors.stock = 'Tồn kho phải là số nguyên từ 0 đến 1.000.';
  }

  return errors;
}
