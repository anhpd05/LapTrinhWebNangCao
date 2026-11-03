import { PublicHeader } from './public-header';

// Thanh header nền tối nằm NGOÀI <main> để skip link ("Bỏ qua, đến nội dung chính") nhảy qua
// logo + menu mà vẫn rơi vào đầu hero (h1). Phần lưới 48px của DarkBand bắt đầu từ ngay dưới header.
export function HeaderBand() {
  return (
    <div className="bg-ink text-[#f4f5f7]">
      <PublicHeader />
    </div>
  );
}
