import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Product } from '../types/product';
import { validateProduct, type ProductErrors, type ProductField } from '../utils/validate-product';

export interface EditProductFormProps {
  product: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

const FIELD_ORDER: readonly ProductField[] = ['name', 'price', 'stock'];

/** Ô số rỗng hoặc chỉ có khoảng trắng là `NaN`, không phải `0`. */
function toNumber(text: string): number {
  return text.trim() === '' ? NaN : Number(text);
}

/**
 * Hộp thoại sửa sản phẩm (dialog modal). Trang cha nên đặt `key={product.id}` để state khởi tạo lại theo sản phẩm.
 * Kiểm tra bằng `validateProduct` khi gửi; form có `noValidate` nên trình duyệt không tự chặn.
 */
export default function EditProductForm({ product, onSave, onCancel }: EditProductFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [submitted, setSubmitted] = useState(false);

  const draft = { name, price: toNumber(price), stock: toNumber(stock) };
  const errors: ProductErrors = submitted ? validateProduct(draft) : {};

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const nameInput = dialog.querySelector<HTMLInputElement>('#edit-name');
    nameInput?.focus();
    nameInput?.select();
    return () => {
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const result = validateProduct(draft);
    const firstInvalid = FIELD_ORDER.find((field) => result[field]);
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid);
      if (input instanceof HTMLElement) input.focus();
      return;
    }
    onSave({ ...product, name: draft.name.trim(), price: draft.price, stock: draft.stock });
  };

  return (
    <dialog
      id="edit-dialog"
      ref={dialogRef}
      className="dialog"
      aria-labelledby="edit-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form id="edit-form" className="dialog-form" noValidate data-product-id={product.id} onSubmit={handleSubmit}>
        <h2 id="edit-title">Sửa sản phẩm #{product.id}</h2>

        <div className="form-field">
          <label htmlFor="edit-name">Tên sản phẩm</label>
          <input
            id="edit-name"
            name="name"
            type="text"
            value={name}
            autoComplete="off"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'edit-name-error' : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name && (
            <p id="edit-name-error" className="form-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="edit-price">Giá (VND)</label>
          <input
            id="edit-price"
            name="price"
            type="number"
            value={price}
            step={1}
            autoComplete="off"
            aria-required="true"
            aria-invalid={errors.price ? true : undefined}
            aria-describedby={errors.price ? 'edit-price-error' : undefined}
            onChange={(event) => setPrice(event.target.value)}
          />
          {errors.price && (
            <p id="edit-price-error" className="form-error" role="alert">
              {errors.price}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="edit-stock">Tồn kho</label>
          <input
            id="edit-stock"
            name="stock"
            type="number"
            value={stock}
            step={1}
            autoComplete="off"
            aria-required="true"
            aria-invalid={errors.stock ? true : undefined}
            aria-describedby={errors.stock ? 'edit-stock-error' : undefined}
            onChange={(event) => setStock(event.target.value)}
          />
          {errors.stock && (
            <p id="edit-stock-error" className="form-error" role="alert">
              {errors.stock}
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--ghost" data-action="cancel" onClick={onCancel}>
            Huỷ
          </button>
          <button type="submit" className="btn btn--primary">
            Lưu
          </button>
        </div>
      </form>
    </dialog>
  );
}
