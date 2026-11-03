# UX / AX review (ak:enhance-ux-ax, chế độ auto)

Phạm vi: trang public của https://deadline.anhpddev.com ở 1440x900, 768x1024, 375x812
(`/`, `/deadlines`, `/deadlines/1`, `/subjects/lap-trinh-web`, `/login`, `/403`, một 404)
cộng đọc code. Đo bằng script trong trình duyệt (contrast tính từ computed style, kích thước
vùng bấm, scrollWidth, heading, meta). Không đổi thiết kế so với prototype.

## Đã đo và ổn (không cần sửa)
- `<html lang="vi">`, viewport, `<title>` riêng từng trang, meta description mọi trang.
- Không tràn ngang ở cả 3 viewport (scrollWidth = innerWidth).
- Muted trên nền tối (`#a9b1bf`, `#8f98a8`) đạt >= 6:1; muted trên nền paper (`#5a6170`) >= 5.5:1.
- `prefers-reduced-motion` đã được xử lý toàn cục trong `app/globals.css`; đếm ngược có nhãn tĩnh,
  không `aria-live` mỗi giây; drawer có `aria-expanded`, Esc, trả focus.
- Open Graph đầy đủ ở `/deadlines/[id]` (ảnh 1200x630, alt, canonical).

## Đã sửa
| # | Vấn đề (trước) | Sửa (sau) | File |
|---|---|---|---|
| 1 | Không có skip link | Thêm "Bỏ qua, đến nội dung chính" (chỉ hiện khi focus) trỏ `#main` | `app/layout.tsx` |
| 2 | `<main>` không nhất quán: `/deadlines` bọc cả header; `/`, `/deadlines/[id]`, `/subjects/[slug]` để hero hoặc phần thân nằm ngoài landmark | Mọi trang có đúng một `<main id="main">`; header tách ra `HeaderBand` (nền ink) nằm ngoài main, hero + thân nằm trong main, skip link rơi vào đầu h1 | `components/layout/header-band.tsx` (mới), 4 page, 403, not-found, error, `(app)/layout.tsx`, loading |
| 3 | Favicon là `favicon.ico` mặc định của Next (25931 B, commit scaffold) | `app/icon.svg` (ô lime + đồng hồ, cùng motif Logo); xoá favicon.ico | `app/icon.svg` |
| 4 | 375px: nav chính chỉ rộng 127px, cuộn ngang ẩn "Deadline", "Môn học" | Mobile: nav xuống hàng riêng full width; `UserMenu` đẩy phải; chừa 6px để focus ring không bị cắt | `public-header.tsx`, `public-nav.tsx` |
| 5 | 403: "Không được phép/✗" `#6b7280` trên `#12161e` = 3.75:1 (AA cần 4.5) | `#8f98a8` (~6:1) | `permission-table.tsx` |
| 6 | Ô tìm kiếm `/deadlines` và ô mật khẩu `/login` có `outline-none`, mất focus ring | Viền ngoài `has-[input:focus-visible]` cùng kiểu ring 3px của trang | `deadline-explorer.tsx`, `login-form.tsx` |
| 7 | Login: heading h2 ("Xong bài nào…") đứng trước h1 | Đổi thành `<p>` cùng style; h1 "Đăng nhập" là heading đầu tiên | `login/page.tsx` |
| 8 | Vùng bấm < 44px: logo 34, nút tick 28, pin timeline 32, nút Hiện/Ẩn, chip demo, lọc trạng thái 40, breadcrumb 20, chip môn 36 | Logo `min-h-11`; tick/breadcrumb/chip dùng `::after` nới vùng bấm lên 44px (không đổi hình); pin `h-11` (lane cao 64px đủ chỗ); các nút còn lại `min-h-11` | `logo.tsx`, `complete-toggle.tsx`, `breadcrumb.tsx`, `timeline.tsx`, `[id]/page.tsx`, `login-form.tsx`, `deadline-explorer.tsx` |
| 9 | Nút tick: `aria-pressed` kèm nhãn đổi "Bỏ đánh dấu/Đánh dấu" -> đọc trạng thái hai lần | Nhãn cố định "Đánh dấu đã xong: <tên>", trạng thái do `aria-pressed` | `complete-toggle.tsx` |
| 10 | Nút Hiện/Ẩn mật khẩu nhãn chỉ "Hiện" | `aria-label` "Hiện mật khẩu"/"Ẩn mật khẩu" (bắt đầu bằng chữ hiển thị) | `login-form.tsx` |
| 11 | Bộ lọc môn/trạng thái chưa nhóm cho AT | `role="group"` + `aria-label` | `deadline-explorer.tsx` |
| 12 | Nút "Sao chép liên kết" im lặng khi clipboard bị chặn | Trạng thái `failed`: nhãn và `role=status` báo "Không chép được…" | `copy-link-button.tsx` |
| 13 | `/`, `/deadlines`, `/subjects/[slug]` chưa có canonical | `alternates.canonical` tương đối (metadataBase tạo URL tuyệt đối) | 3 page |

## Điểm theo rubric (0-3, sau sửa; chưa dựng lại để đo lại)
First impression 2, Brand 3, Content 2, Hierarchy 2, Responsive 2 (nav mobile đã sửa), Accessibility 2,
Motion 2, Trust 2. Không có mục nào < 2 sau sửa.

## Còn lại (không sửa vì ngoài phạm vi "sửa nhỏ" hoặc cần quyết định chủ dự án)
- Trang đã build: nhớ chạy lại build và xem 3 viewport để xác nhận `HeaderBand` (lưới 48px của DarkBand giờ
  bắt đầu dưới header, header phẳng màu ink; chênh lệch nền rất nhẹ) và pin timeline cao 44px không chồng nhau.
  Chưa kiểm bằng build vì tác vụ cấm chạy build/dev; chỉ chạy `npx tsc --noEmit` (sạch).
- Open Graph chỉ có ảnh ở `/deadlines/[id]`; `/`, `/deadlines`, `/subjects/*` dùng `twitter:card=summary`
  và không có `og:image`. Nên thêm `app/opengraph-image` chung (cần route/ảnh mới).
- Chưa có `llms.txt`, markdown twin, JSON-LD `WebSite`/`Organization` (chỉ `BreadcrumbList` ở trang chi tiết);
  chưa có nhóm nút "Copy page / View as Markdown". Là hygiene mức thấp cho site nội bộ lớp.
- Trang `/login` ở < 1024px không hiện logo (panel trái ẩn; logo màu sáng sẽ vô hình trên nền paper).
- Drawer app shell chưa có focus trap (Tab có thể ra khỏi dialog); Esc và trả focus đã có.
- Chữ watermark mã môn (WEB, CSDL…) tương phản thấp theo script nhưng là trang trí `aria-hidden`.
- Phiên đăng nhập còn sót trong trình duyệt khi đo làm `/login` chuyển hướng ở lần đo đầu; đã xoá cookie
  và đo lại.
