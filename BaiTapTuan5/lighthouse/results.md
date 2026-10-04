# Kết quả đo Lighthouse (sinh tự động bởi `scripts/build-results.mjs`)

**Trạng thái kiểm tra: HỢP LỆ**

## Cảnh báo

- before/a11y.json: buildHash 91ef64c8bd1e != measured 285db2571d89 (before build layout changed since baseline; same sourceHash)

## Môi trường đo

Lấy từ `summary.json` của median run, không lấy lúc sinh file.

| Mục | Before | After |
| --- | --- | --- |
| Lighthouse | 13.5.0 | 13.5.0 |
| Chrome | 154.0.0.0 | 154.0.0.0 |
| Node | v24.14.0 | v24.14.0 |
| benchmarkIndex | 1857 | 1859 |
| Form factor | mobile | mobile |
| Throttling | simulate (RTT 150 ms, 1638.4 Kbps, CPU x4) | simulate (RTT 150 ms, 1638.4 Kbps, CPU x4) |
| Số run hợp lệ / đã chạy | 5/5 | 5/5 |
| fetchTime (median) | 2026-10-04T15:33:35.138Z | 2026-10-04T15:47:03.576Z |
| Run đầu - run cuối | 2026-10-04T15:33:35.138Z - 2026-10-04T15:35:42.132Z | 2026-10-04T15:46:37.096Z - 2026-10-04T15:47:03.576Z |
| n / checksum dữ liệu | 10000 / `ee0af36b` | 10000 / `ee0af36b` |

## Bảng chính (navigation, Lighthouse Mobile, median)

Ô before/after: median (min - max trong các run hợp lệ). Chênh lệch = after - before.

| Chỉ số | Before | After | Chênh lệch | % |
| --- | --- | --- | --- | --- |
| Performance score | 60 (57 - 60) | 97 (95 - 97) | +37 | +61.7% |
| FCP | 1,805 ms (1,805 ms - 1,811 ms) | 1,511 ms (1,511 ms - 1,553 ms) | -293 ms | -16.3% |
| LCP | 2,943 ms (2,869 ms - 3,350 ms) | 1,639 ms (1,639 ms - 1,685 ms) | -1,304 ms | -44.3% |
| TBT | 5,726 ms (4,741 ms - 6,165 ms) | 183 ms (183 ms - 222 ms) | -5,543 ms | -96.8% |
| CLS | 0.000 (0.000 - 0.000) | 0.000 (0.000 - 0.000) | 0.000 | — |
| Speed Index | 5,164 ms (5,036 ms - 5,454 ms) | 1,511 ms (1,511 ms - 1,553 ms) | -3,653 ms | -70.7% |
| Số phần tử DOM (tự đếm, `document.body`) | 100,049 | 267 | -99,782 | -99.7% |
| Số phần tử DOM (Lighthouse `dom-size-insight`) | 100,051 | 269 | -99,782 | -99.7% |
| JS không dùng (`unused-javascript`) | 132.1 KiB | 35.4 KiB | -96.8 KiB | -73.2% |
| Tổng byte tải (`total-byte-weight`) | 180.2 KiB | 85.7 KiB | -94.5 KiB | -52.4% |
| JS ban đầu (gzip) | 175.5 KiB | 80.4 KiB | -95.2 KiB | -54.2% |
| JS ban đầu (chưa nén) | 592.9 KiB | 254.0 KiB | -338.9 KiB | -57.2% |

### Các run navigation

| Trang | Run | Trạng thái | Mã lỗi | Score | LCP | TBT |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| before | 1 | ok | - | 60 | 2,943 ms | 5,726 ms | median |
| before | 2 | ok | - | 58 | 3,064 ms | 6,165 ms |  |
| before | 3 | ok | - | 60 | 2,869 ms | 5,703 ms |  |
| before | 4 | ok | - | 60 | 2,921 ms | 5,739 ms |  |
| before | 5 | ok | - | 57 | 3,350 ms | 4,741 ms |  |
| after | 1 | ok | - | 96 | 1,648 ms | 217 ms |  |
| after | 2 | ok | - | 96 | 1,685 ms | 213 ms |  |
| after | 3 | ok | - | 95 | 1,654 ms | 222 ms |  |
| after | 4 | ok | - | 96 | 1,647 ms | 215 ms |  |
| after | 5 | ok | - | 97 | 1,639 ms | 183 ms | median |

### Truy vết (provenance)

| Mục | Before | After |
| --- | --- | --- |
| sourceHash | `ff7ea8502e236f2afdc7e86aa654c9e21a849f2f52723b14925379b1ca1eb696` | `2d9afa4b0b748eb48053f46508dd32ba12da3de0ead4817347b9783de3b112b2` |
| buildHash | `285db2571d8982af3580dcbe5978f9299849db94099cdcac58bf04bbc2f547b3` | `7296e4cb97823fa5b928255e3cb29d34def4f703d9c471a40962da811af83f10` |
| Median run | run-1.json | run-5.json |
| Build snapshot (before) | `285db2571d8982af3580dcbe5978f9299849db94099cdcac58bf04bbc2f547b3` | - |

## Bảng `?n=` (3 lần mỗi ô)

Ô lỗi không bị chạy lại để chọn số đẹp; `Mã lỗi` là mã Lighthouse/Node thật của các run không hợp lệ.

| n | Trang | Hợp lệ/đã chạy | Trạng thái | Score | FCP | LCP | TBT | DOM | Mã lỗi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1,000 | before | 3/3 | ok | 98 | 1,969 ms | 1,969 ms | 61 ms | 10,049 | - |
| 1,000 | after | 3/3 | ok | 99 | 1,510 ms | 1,587 ms | 104 ms | 267 | - |
| 10,000 | before | 3/3 | ok | 57 | 1,972 ms | 3,219 ms | 6,016 ms | 100,049 | - |
| 10,000 | after | 3/3 | ok | 96 | 1,509 ms | 1,644 ms | 219 ms | 267 | - |
| 50,000 | before | 3/3 | ok | 36 | 1,971 ms | 6,293 ms | 18,753 ms | 500,049 | - |
| 50,000 | after | 3/3 | ok | 80 | 1,513 ms | 1,931 ms | 785 ms | 267 | - |

## Timespan (tìm "dien thoai" rồi sắp xếp giá)

Timespan TBT sums the blocking time of the whole interaction trace under 4x CPU throttling; it is not comparable with navigation TBT or the navigation score.

| Chỉ số | Before | After | Chênh lệch | % |
| --- | --- | --- | --- | --- |
| TBT (Timespan) | 12,102 ms (numeric) | 663 ms (numeric) | -11,439 ms | -94.5% |
| CLS (Timespan) | 0.000 (numeric) | 0.000 (numeric) | 0.000 | — |
| INP | 3,855 ms (numeric) | 201 ms (numeric) | -3,654 ms | -94.8% |

## Profiler (React `<Profiler>`, build profiling)

- (a) Edit the stock of the first row via the form and save (evidence for memo + useCallback + immutable update): rowRender
- (b) Open the edit form then cancel, list state untouched (evidence for lazy initializer + useMemo): generate, filterSort
- (c) Type "dien thoai" then click #sort-price (combined evidence of all techniques, not memo alone): App commits / actualMs / maxMs

Không có ngưỡng đạt/không đạt; đây là số đo thực tế.

| Số đo | Before | After | Chênh lệch | % |
| --- | --- | --- | --- | --- |
| (a) số dòng đang render trong DOM | 10,000 | 22 | - | - |
| (a) `rowRender` sau khi sửa 1 sản phẩm | 10,000 | 1 | -9,999 | -100.0% |
| (b) `generate` khi mở/huỷ form | 2 | 0 | -2 | -100.0% |
| (b) `filterSort` khi mở/huỷ form | 2 | 0 | -2 | -100.0% |
| (c) `App` commits | 11 | 22 | +11 | +100.0% |
| (c) `App` actualDuration tổng | 568.6 ms | 206.7 ms | -361.9 ms | -63.6% |
| (c) `App` actualDuration lớn nhất | 151.6 ms | 22.8 ms | -128.8 ms | -85.0% |

## Accessibility (Lighthouse, mobile)

| Mục | Before | After |
| --- | --- | --- |
| n (cùng quy mô so sánh) | 1000 | 1000 |
| Điểm | 100 | 100 |
| Audit chưa đạt | không | không |

### Accessibility ban đầu ở n=10.000

| Trang | n | Trạng thái | Điểm | Mã lỗi |
| --- | --- | --- | --- | --- |
| before | 10000 | runtime-error | n/a | PROTOCOL_TIMEOUT |
| after | 10000 | ok | 100 | - |

Bảng Accessibility so sánh ở trên dùng cùng n=1000 trên cả hai trang, cấu hình Lighthouse mặc định; không thay gatherer hoặc bỏ audit. Bản ghi ban đầu được giữ nguyên, kể cả lỗi timeout.

## Tiêu chí chấp nhận (thông tin)

| Tiêu chí | Kết quả | Chi tiết |
| --- | --- | --- |
| Before DOM > 50,000 elements | ĐẠT | 100,049 |
| After DOM < 1,500 elements | ĐẠT | 267 |
| Accessibility after >= before | ĐẠT | 100 -> 100 (n=1000, equal-size comparison) |
| Profiler (a): after rowRender < before | ĐẠT | 10000 -> 1 |
| Profiler (b): after generate = 0 and filterSort = 0 | ĐẠT | generate 0, filterSort 0 |
| Recharts eager in before, lazy only in after | ĐẠT | before eager=true; after eager=false, lazy=true |

## Ảnh minh chứng bắt buộc

| Ảnh | Before | After |
| --- | --- | --- |
| score | lighthouse/screenshots/before-score.png | lighthouse/screenshots/after-score.png |
| metrics | lighthouse/screenshots/before-metrics.png | lighthouse/screenshots/after-metrics.png |
| filmstrip | lighthouse/screenshots/before-filmstrip.png | lighthouse/screenshots/after-filmstrip.png |
| unused-js | lighthouse/screenshots/before-unused-js.png | lighthouse/screenshots/after-unused-js.png |
| dom-size | lighthouse/screenshots/before-dom-size.png | lighthouse/screenshots/after-dom-size.png |
| full | lighthouse/screenshots/before-full.png | lighthouse/screenshots/after-full.png |
| flow-full | lighthouse/screenshots/before-flow-full.png | lighthouse/screenshots/after-flow-full.png |
| app-mobile | lighthouse/screenshots/before-app-mobile.png | lighthouse/screenshots/after-app-mobile.png |
| app-desktop | lighthouse/screenshots/before-app-desktop.png | lighthouse/screenshots/after-app-desktop.png |
| app-stats | lighthouse/screenshots/before-app-stats.png | lighthouse/screenshots/after-app-stats.png |
| app-edit-error | lighthouse/screenshots/before-app-edit-error.png | lighthouse/screenshots/after-app-edit-error.png |

