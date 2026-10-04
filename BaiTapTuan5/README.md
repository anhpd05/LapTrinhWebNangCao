# Bài tập tuần 5 — Hiệu năng React

Hai entry build độc lập, cùng bộ dữ liệu seed 42 và cùng chức năng quản lý sản phẩm:

- `before.html`: render tất cả dòng, tính lại dữ liệu/lọc/sắp xếp ở mỗi render, import biểu đồ và form tĩnh.
- `after.html`: virtualize dòng 44px, memoization và deferred search, tải biểu đồ/form theo nhu cầu.
- `index.html`: trang chọn bản. Thêm `?n=1000`, `?n=10000`, `?n=50000`; `?n=0` hợp lệ. Mặc định 10.000, tối đa 50.000.

## Cài và chạy

Yêu cầu **Node ≥ 22.19**, Chrome cài trên máy. Không dùng React Compiler, backend hay API ngoài.

```sh
cd BaiTapTuan5
node -v
npm ci
npm run dev
```

Build/kiểm tra:

```sh
npm run lint
npm run build
npm run preview
```

Mở `http://127.0.0.1:4173/before.html` hoặc `/after.html`. Preview dùng `--strictPort`; không tự chuyển cổng. Script đo từ chối dev server, sai trang hoặc sai mode build.

## Đo và chụp minh chứng

Giữ preview chạy trong một terminal riêng. Chạy các phép đo **tuần tự**, không cùng lúc với các ứng dụng nặng. Ví dụ dưới đây dùng `lighthouse/replay/` để không ghi đè baseline và ảnh nộp hiện tại.

```sh
npm run check:chunks -- before --out=lighthouse/replay
npm run measure:before -- --out=lighthouse/replay
npm run measure:flow -- before --out=lighthouse/replay
npm run snapshot:before -- --out=lighthouse/replay
npm run shots -- before --out=lighthouse/replay
npm run check:chunks -- after --out=lighthouse/replay
npm run measure:after -- --out=lighthouse/replay
npm run measure:flow -- after --out=lighthouse/replay
npm run measure:scale -- --out=lighthouse/replay/scale
node scripts/measure-navigation.mjs before --a11y --n=1000 --out=lighthouse/replay
node scripts/measure-navigation.mjs after --a11y --n=1000 --out=lighthouse/replay
npm run shots -- after --out=lighthouse/replay
```

Profiler phải dùng build riêng, không dùng số đo này như số đo Lighthouse production:

```sh
npm run build:prof
npm run preview:prof
# terminal khác, sau khi cổng 4174 sẵn sàng:
npm run measure:profile -- before --out=lighthouse/replay
npm run measure:profile -- after --out=lighthouse/replay
npm run results -- --out=lighthouse/replay --scale-out=lighthouse/replay/scale
```

- Navigation: 5 lần, run đại diện theo `computeMedianRun`. Scale: 3 lần mỗi ô, run lỗi ghi `status`/`code`. Timespan không so được với TBT navigation.
- Profiler: (a) sửa 1 dòng, (b) mở/huỷ form, (c) tìm kiếm + sắp xếp (bằng chứng tổng hợp).
- Accessibility so sánh ở n=1.000 (before n=10.000 bị `PROTOCOL_TIMEOUT`, giữ trong `a11y-n10000.json`).
- Lệnh không có `--out` ghi đè `lighthouse/`; muốn giữ baseline nộp bài thì dùng `--out` riêng như trên. Parity là browser smoke trong phiên, không có script tái sinh `parity.json`.

## Artifact và tính toàn vẹn

Đọc [báo cáo](./bao-cao.md) và [kết quả do script sinh](./lighthouse/results.md).

`lighthouse/` giữ summary, report HTML, ảnh và baseline `before/build-snapshot/`. JSON run thô và flow thô được ignore vì có thể sinh lại; lockfile được giữ để cố định dependency.

**Quy trình nộp bài:** đo navigation/Timespan before và lưu snapshot trước khi viết after, sau đó đóng băng `src/before`, `src/shared`, `before.html`, `vite.config.ts`, `package-lock.json`. `sourceHash` bao phủ các file này; `buildHash` bao phủ HTML và closure import tĩnh/dynamic (JS/CSS/assets) trong manifest cùng file local HTML tham chiếu. Nếu phải sửa bản đã đóng băng, giữ baseline gốc, đo rerun ở thư mục riêng và giải thích trong báo cáo. Không sửa mã rồi sử dụng số đo cũ.

`fetchTime` chỉ chứng minh thứ tự phép đo, không tự chứng minh mã nguồn bất biến. Không commit/push tự động từ các script đo.
