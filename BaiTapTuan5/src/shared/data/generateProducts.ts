import { perfCount } from '../perf/perf';
import { CATEGORIES, type Category, type Product } from '../types/product';

export const GENERATOR_VERSION = 1;
export const DEFAULT_SEED = 42;

const BASE_DATE_MS = Date.UTC(2023, 0, 1);
const DAY_MS = 86_400_000;
const DATE_SPAN_DAYS = 730;

const CATALOG: Record<Category, { types: readonly string[]; brands: readonly string[] }> = {
  'Điện thoại': {
    types: ['Điện thoại'],
    brands: ['Samsung Galaxy', 'iPhone', 'Xiaomi Redmi', 'OPPO Reno', 'Vivo', 'Realme', 'Nokia', 'Honor'],
  },
  Laptop: {
    types: ['Laptop'],
    brands: ['ASUS Vivobook', 'Acer Aspire', 'Dell Inspiron', 'HP Pavilion', 'Lenovo IdeaPad', 'MSI Modern', 'MacBook Air', 'LG Gram'],
  },
  'Máy tính bảng': {
    types: ['Máy tính bảng'],
    brands: ['iPad', 'Samsung Galaxy Tab', 'Xiaomi Pad', 'Lenovo Tab', 'Huawei MatePad', 'Amazon Fire'],
  },
  'Phụ kiện': {
    types: ['Sạc nhanh', 'Cáp sạc', 'Ốp lưng', 'Sạc dự phòng', 'Chuột không dây', 'Bàn phím cơ'],
    brands: ['Anker', 'Baseus', 'Belkin', 'Logitech', 'Ugreen', 'Rapoo'],
  },
  'Âm thanh': {
    types: ['Tai nghe', 'Loa Bluetooth', 'Tai nghe chụp tai'],
    brands: ['Sony', 'JBL', 'Marshall', 'Soundcore', 'Edifier', 'Bose'],
  },
  'Đồng hồ thông minh': {
    types: ['Đồng hồ thông minh', 'Vòng đeo tay thông minh'],
    brands: ['Apple Watch', 'Garmin', 'Amazfit', 'Huawei Watch', 'Xiaomi Band', 'Samsung Galaxy Watch'],
  },
  'Màn hình': {
    types: ['Màn hình'],
    brands: ['Dell UltraSharp', 'LG UltraGear', 'Samsung Odyssey', 'ViewSonic', 'AOC', 'Gigabyte'],
  },
  'Thiết bị mạng': {
    types: ['Router Wi-Fi', 'Bộ phát Wi-Fi Mesh', 'Switch mạng'],
    brands: ['TP-Link', 'ASUS', 'Tenda', 'Ubiquiti', 'Mercusys', 'Xiaomi'],
  },
};

const SERIES_LETTERS = 'ABCDEFGHKMNPRSTVXZ';
const VARIANTS = ['', 'Pro', 'Max', 'Lite', 'Plus', 'Ultra', 'Mini', 'Neo'] as const;
const COLORS = ['Đen', 'Trắng', 'Xanh dương', 'Vàng đồng', 'Hồng', 'Xám', 'Bạc'] as const;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sinh `n` sản phẩm xác định theo `seed`. `id` chạy từ 1 đến n nên không trùng.
 * Mỗi sản phẩm luôn tiêu thụ đúng 10 số ngẫu nhiên để dữ liệu ổn định khi đổi `n`.
 */
export function generateProducts(n: number, seed = DEFAULT_SEED): Product[] {
  perfCount('generate');
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`generateProducts: n không hợp lệ (${n})`);

  const rand = mulberry32(seed);
  const products: Product[] = new Array<Product>(n);

  for (let i = 0; i < n; i++) {
    const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const { types, brands } = CATALOG[category];
    const type = types[Math.floor(rand() * types.length)];
    const brand = brands[Math.floor(rand() * brands.length)];
    const letter = SERIES_LETTERS[Math.floor(rand() * SERIES_LETTERS.length)];
    const model = 100 + Math.floor(rand() * 900);
    const variant = VARIANTS[Math.floor(rand() * VARIANTS.length)];
    const color = COLORS[Math.floor(rand() * COLORS.length)];
    const price = (100 + Math.floor(rand() * 49_901)) * 1000;
    const stock = Math.floor(rand() * 501);
    const offsetDays = Math.floor(rand() * DATE_SPAN_DAYS);

    const name = `${type} ${brand} ${letter}${model}${variant ? ` ${variant}` : ''} ${color}`;
    const createdAt = new Date(BASE_DATE_MS + offsetDays * DAY_MS).toISOString().slice(0, 10);

    products[i] = { id: i + 1, name, category, price, stock, createdAt };
  }

  return products;
}
