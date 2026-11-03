# Class Deadline Hub

Ứng dụng web cho lớp theo dõi deadline các môn học: xem công khai, đăng nhập để đánh dấu đã xong, và lớp trưởng có khu vực quản trị để thêm/xoá deadline. Bài thực hành BTTH3 môn Lập trình Web nâng cao (PTIT).

- **Bản chạy thật:** https://deadline.anhpddev.com
- **Dữ liệu:** file JSON ở phía server (không dùng database), nên bản deploy phải chạy trên một server Node có ghi được file. Xem mục [Deploy (Hostinger)](#deploy-hostinger).

## Giới thiệu và công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 15.5 (App Router, React 19), TypeScript |
| Xác thực | Auth.js v5 (`next-auth` v5 beta, Credentials + GitHub OAuth khi có cấu hình, session JWT) + `bcryptjs` |
| Giao diện | Tailwind CSS v4 (token khai báo bằng `@theme` trong `app/globals.css`) |
| Kiểm tra dữ liệu | `zod` v4 |
| Font | `next/font/google`: Be Vietnam Pro, Bricolage Grotesque, JetBrains Mono (cả 3 đều bật subset `vietnamese`) |
| Kiểm thử | Jest (qua `next/jest`) |
| Dữ liệu | `data/*.json`, chỉ được đọc/ghi trong `lib/data.ts` |

**Giao diện dựa trên prototype** do người dùng cung cấp (file HTML tự giải nén gồm 8 màn hình). Prototype được dùng làm chuẩn về hình ảnh, bố cục, màu, chữ và ngôn từ; còn kiến trúc (SSG/ISR/SSR, Server Component mặc định, `can()`, Server Action) làm theo yêu cầu của đề, không theo prototype (prototype chỉ là một component với state trong bộ nhớ). Thanh công cụ "PROTOTYPE" đã bỏ vì không thuộc phạm vi; nút "Tiếp tục với GitHub" là đăng nhập GitHub OAuth thật (xem [Đăng nhập bằng GitHub](#đăng-nhập-bằng-github)).

### Các cải thiện so với prototype (đã làm)

| # | Vấn đề ở prototype | Cải thiện trong bản này |
|---|---|---|
| 1 | Mobile 390px: nav xuống dòng lộn xộn, H1 76px tràn màn hình | Nav public xuống một hàng riêng rộng hết màn hình trên mobile (vẫn cuộn ngang được nếu thiếu chỗ), tiêu đề dùng `clamp()`, sidebar app thành thanh trên cùng + drawer khi < 1024px (`AppTopBar`) |
| 2 | Đồng hồ re-render cả trang mỗi giây | Chỉ component đồng hồ có `setInterval`; chip "còn N ngày" cập nhật 60 giây một lần (`useNow(renderedAt, intervalMs)`) |
| 3 | Chuyển động liên tục | Tôn trọng `prefers-reduced-motion` |
| 4 | `role="timer"` cập nhật mỗi giây khiến trình đọc màn hình đọc liên tục | Không đặt `aria-live` cho đồng hồ; có nhãn chữ tĩnh cho trình đọc màn hình |
| 5 | Dòng thời gian rộng 960px phải cuộn ngang | Mobile đổi sang danh sách dọc theo tuần; desktop vẫn cuộn ngang |
| 6 | Lỗi validate chỉ có dòng gợi ý | Hiện lỗi zod theo từng field (`aria-describedby`); nút submit bị disable khi đang gửi |
| 7 | Không có trạng thái loading / error | `loading.tsx` dùng skeleton; `error.tsx` cùng phong cách 404 với nút "Thử lại" |
| 8 | Xoá không cần xác nhận | Hỏi xác nhận trước khi xoá (`DeleteButton`) |
| 9 | Chữ phụ `#8F98A8` trên nền tối, `#5A6170` trên nền sáng chưa chắc đủ tương phản | Kiểm tra tương phản AA (≥ 4.5:1) bằng Lighthouse Accessibility, chữ nào thiếu thì tăng độ sáng |

Quy tắc chống lỗi hydration cho UI phụ thuộc thời gian: Server Component truyền `renderedAt` (giờ lúc server render) xuống `useNow()`; lần render đầu ở client dùng đúng giá trị đó nên HTML server và client khớp nhau, sau khi mount mới chuyển sang giờ thật.

## Cách chạy

Yêu cầu Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
```

Điền `AUTH_SECRET` trong `.env.local`. Sinh chuỗi ngẫu nhiên bằng một trong hai cách:

```bash
openssl rand -base64 32
# hoặc không cần openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> Không dùng `npx auth secret`: lệnh này chạy nhầm sang một CLI khác nên không sinh được secret cho dự án.

Các biến trong `.env.example`: `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` (GitHub OAuth App, xem [Đăng nhập bằng GitHub](#đăng-nhập-bằng-github)), `SITE_URL` (mặc định `http://localhost:3000`), `DATA_DIR` (để trống thì dùng `./data`).

```bash
npm run dev                 # chế độ phát triển (Turbopack)  -> http://localhost:3000
npm run build && npm start  # bản production
npm test                    # Jest
```

### Tài khoản thử

| Họ tên | MSV | Email | Mật khẩu | Vai trò |
|---|---|---|---|---|
| Phạm Đức Anh | B23DCCC014 | `admin@ptit.edu.vn` | `admin123` | Lớp trưởng (`admin`) |
| Nguyễn Mai Sao | B23DCCC027 | `sv@ptit.edu.vn` | `sv123456` | Sinh viên (`user`) |

Email và mật khẩu lấy theo đề bài. Mật khẩu trong `data/users.json` được lưu dạng hash bcrypt.

## Chuyển động và phản hồi (UX)

- **Thanh tiến trình khi đổi trang** (`components/ui/nav-progress.tsx`): vạch lime 3px ở mép trên chạy ngay khi bấm link nội bộ và hoàn tất khi đường dẫn đổi; hữu ích nhất với trang SSR như `/dashboard`, `/admin`.
- **Vào trang:** trang công khai (brand) cho các khối chính và lưới thẻ vào lần lượt (tối đa ~200 ms trễ); trang app (product) chỉ trượt nhanh 220 ms. Chỉ dịch chuyển, không bắt đầu từ opacity 0 nên không chặn LCP và nội dung luôn hiển thị nếu animation lỗi.
- **Phản hồi chạm:** link/nút nhấc lên 2 px khi hover (chỉ trên thiết bị có chuột, tránh hover "dính" trên cảm ứng), lún xuống khi nhấn; ô tick "đã xong" nảy nhẹ một lần.
- **Trang chủ `/`** (chuyển động mang nghĩa "thời gian đang chạy"):
  - Hero: 3 dòng tiêu đề vào lần lượt, chấm "HÔM NAY" có vòng lan, 2 nút "Xem dòng thời gian" / "Tất cả deadline" (rộng hết màn hình trên mobile); nền lưới mờ dần và quầng sáng lime trôi chậm.
  - Đồng hồ "Deadline gần nhất": chữ số lật khi đổi giá trị.
  - Dòng thời gian (desktop): mốc hiện lần lượt từ trái sang phải, mốc kế tiếp có vòng nhịp, vạch "hôm nay" phát sáng; hover/focus vào mốc hiện tên bài và môn.
  - Thẻ môn: số deadline, mũi tên hiện khi hover, thanh vạch trạng thái mọc ra khi cuộn tới (chỉ khi trình duyệt hỗ trợ `animation-timeline: view()`), chú thích màu vạch dưới tiêu đề "Theo môn học".
- Chỉ animate `transform`, `opacity`, màu, `box-shadow`; không dùng `transition: all`; easing ease-out. Mọi chuyển động tắt hoàn toàn khi hệ điều hành bật **prefers-reduced-motion** (đã kiểm: `animation-name: none`).

## Cấu trúc thư mục

```
app/
  (public)/            Trang công khai, layout có header
    page.tsx             /
    deadlines/(list)/    /deadlines
    deadlines/[id]/      /deadlines/[id] + opengraph-image/route.tsx (ảnh OG động)
    subjects/[slug]/     /subjects/[slug]
    login/  403/
  (app)/               App shell có sidebar (cần đăng nhập)
    dashboard/           /dashboard (có layout, loading, error riêng)
    admin/               /admin
  api/auth/[...nextauth]/   Handler của Auth.js
  api/me/progress/          GET tiến độ cá nhân (force-dynamic)
  error.tsx  not-found.tsx  robots.ts  sitemap.ts  layout.tsx  globals.css
  opengraph-image.tsx       Ảnh chia sẻ chung cho /, /deadlines, /subjects/*
components/            admin/ auth/ dashboard/ deadline/ layout/ progress/ time/ ui/ ...
lib/
  permissions.ts       Ma trận quyền + can()  (nguồn duy nhất)
  session.ts           requirePermission() cho page (lớp 2)
  actions.ts           Server Action (lớp 3)
  data.ts              Module duy nhất đọc/ghi data/*.json
  countdown.ts format.ts validation.ts site.ts safe-callback.ts timeline-layout.ts types.ts
hooks/use-now.ts       Hook thời gian cho client
data/                  deadlines.json subjects.json users.json progress.json revalidate-log.json (seed)
__tests__/             countdown / permissions / safe-callback
auth.ts  auth.config.ts  middleware.ts  types/next-auth.d.ts
.hostinger/site.json   Thông tin site Hostinger (không chứa bí mật)
lighthouse/            Báo cáo Lighthouse dạng HTML (/ và /deadlines/1)
```

## Kết quả build: 6 route và chiến lược render

Ký hiệu trong output của `npm run build`: **○** = Static (SSG), **●** = SSG có `generateStaticParams` (có thể kèm revalidate), **ƒ** = Dynamic (SSR theo mỗi request).

| Route | Chiến lược | Ký hiệu | Chi tiết thật khi build | Lý do chọn |
|---|---|---|---|---|
| `/` | SSG | ○ | Không export `revalidate` | Nội dung gần như không đổi và ai cũng thấy giống nhau, nên SSG cho TTFB thấp nhất. Khi admin thêm/xoá deadline, Server Action gọi `revalidatePath('/')` để làm mới đúng lúc. |
| `/subjects/[slug]` | SSG + on-demand | ● | `generateStaticParams` sinh 4 path (4 môn) | Chỉ có 4 môn cố định nên dựng trước cả 4 trang tĩnh; Server Action `revalidatePath` đúng môn bị ảnh hưởng. |
| `/deadlines` | ISR theo thời gian | ○ | `revalidate = 60` (hiển thị `1m`) | Danh sách chấp nhận trễ tối đa 60 giây, không cần làm mới ngay sau thao tác của admin nên dùng ISR chu kỳ. Cố ý **không** `revalidatePath('/deadlines')`. |
| `/deadlines/[id]` | ISR on-demand | ● | `generateStaticParams` sinh 12 id; `revalidate = 3600` (`1h`) làm lưới an toàn; `dynamicParams = true` | Cần đúng ngay sau khi admin sửa nhưng vẫn muốn phục vụ HTML tĩnh (SEO, ảnh OG, tốc độ). Xem câu hỏi (1) bên dưới. |
| `/dashboard` | SSR | ƒ | Đọc session + tiến độ của từng người | Phụ thuộc người dùng đang đăng nhập nên không thể dùng chung HTML tĩnh. |
| `/admin` | SSR | ƒ | Đọc session + dữ liệu mới nhất + nhật ký làm mới | Cần dữ liệu mới nhất và phải kiểm tra quyền ở mỗi request. |

Kết quả `npm run build` (văn bản đầy đủ: [docs/build-output.txt](docs/build-output.txt)):

![Bảng route của npm run build](docs/images/build-output.png)

Ảnh view-source `/deadlines/1` (title, og:image, twitter:card, canonical, JSON-LD BreadcrumbList lấy từ HTML thật):

![view-source /deadlines/1](docs/images/view-source-deadline-1.png)

Ảnh giao diện thật ở 1440px và 375px: [docs/images/ui/](docs/images/ui/) (`desktop-*.png`, `mobile-*.png`).

### Ghi chú kỹ thuật

- **`/subjects/[slug]` dùng `dynamicParams = true` + `notFound()`**: ở Next 15.5, route đặt `dynamicParams = false` bị `revalidatePath` làm cho slug hợp lệ trả về 404 (trang bị dựng lại thành trạng thái không có params). Vì vậy route cho phép `dynamicParams = true`, kiểm tra slug trong trang và gọi `notFound()` với slug không tồn tại.
- **Kiểu JWT**: `next-auth/jwt` chỉ `export *` từ `@auth/core/jwt`, nên khai báo mở rộng kiểu `JWT` phải viết `declare module '@auth/core/jwt'` (xem `types/next-auth.d.ts`), và `@auth/core` được ghim đúng `0.41.3` trong `package.json` để module được augment khớp với bản mà `next-auth` đang dùng.
- **`ts-node` trong `devDependencies`**: Jest cần nó để đọc file cấu hình `jest.config.ts`.
- **Google Fonts subset `vietnamese`**: cả 3 font đều khai báo `subsets: ["vietnamese", "latin", "latin-ext"]` trong `app/layout.tsx` để hiển thị đủ dấu tiếng Việt (các chữ ă/đ/ơ/ư nằm ở cả range `vietnamese` lẫn `latin-ext`). Bricolage Grotesque và JetBrains Mono là font biến thiên, nên không khai báo `weight` dạng danh sách (tránh lỗi build Turbopack với URL font dạng `?kit=`).
- **`revalidatePath` với route group**: khi truyền `type` (`'page'`/`'layout'`), tham số là **đường dẫn file route, gồm cả route group**. Next gắn tag cache cho trang chi tiết là `/(public)/deadlines/[id]/page`, nên `lib/actions.ts` gọi `revalidatePath('/(public)/deadlines/[id]', 'page')` (mọi trang chi tiết) cùng `revalidatePath('/deadlines/<id>')` (đúng trang bị thêm/xoá). Bản trước viết `revalidatePath('/deadlines/[id]', 'layout')`, thiếu `(public)`, nên không khớp tag nào: trên production, xoá #13 xong `/deadlines/13` vẫn trả bài cũ (`x-nextjs-cache: HIT`). Đã sửa và đo lại (xem câu hỏi (1)).
- **`AUTH_URL` sau reverse proxy**: trên Hostinger, Next nhận host `0.0.0.0:3000` nên Auth.js dựng sai URL tuyệt đối (Đăng xuất chuyển tới `https://0.0.0.0:3000/`). `auth.ts` gán `AUTH_URL = SITE_URL` khi chưa khai báo `AUTH_URL`; next-auth đọc biến này ở mỗi request.

## Danh sách file `'use client'` và lý do

Mặc định mọi component là Server Component. Chỉ 35 file dưới đây khai báo `'use client'`, mỗi file đều cần state, effect, sự kiện trình duyệt hoặc hook của client (`useSession`, `usePathname`, `useNow`...).

**Hạ tầng**

| File | Lý do |
|---|---|
| `components/providers.tsx` | Bọc `SessionProvider` (Auth.js) và `ProgressProvider`; context chỉ chạy ở client |
| `components/progress/progress-provider.tsx` | Tải tiến độ cá nhân ở client qua `GET /api/me/progress` để `/deadlines` và `/deadlines/[id]` vẫn là trang tĩnh dùng chung HTML (ISR) |
| `hooks/use-now.ts` | Hook dùng `useState`/`useEffect`; trả `renderedAt` ở lần render đầu rồi cập nhật theo chu kỳ để tránh lỗi hydration |
| `app/error.tsx` | Error boundary bắt buộc phải là Client Component (nút "Thử lại") |
| `app/(app)/dashboard/error.tsx` | Error boundary riêng cho dashboard (nút "Thử lại") |
| `components/ui/nav-progress.tsx` | `usePathname` + sự kiện click để chạy thanh tiến trình khi đổi trang |

**Xác thực**

| File | Lý do |
|---|---|
| `components/auth/login-form.tsx` | Form có state, hiện/ẩn mật khẩu, điền nhanh tài khoản, `useRouter`/`useSearchParams` |
| `components/auth/user-menu.tsx` | `useSession` để hiện avatar/tên/vai trò và `signOut` |
| `components/auth/who-am-i.tsx` | `useSession` để hiện tên và vai trò hiện tại ở trang 403 |
| `components/auth/switch-account-button.tsx` | Gọi `signOut` (hàm của client) khi bấm |
| `components/home-cta.tsx` | `useSession`: đã đăng nhập thì nút đổi thành "Mở Việc của tôi →", giữ trang `/` là SSG |

**Điều hướng và layout**

| File | Lý do |
|---|---|
| `components/layout/public-nav.tsx` | `usePathname` để tô sáng mục nav đang chọn |
| `components/layout/sidebar-nav.tsx` | `usePathname` để tô sáng mục sidebar |
| `components/layout/app-top-bar.tsx` | State mở/đóng drawer trên mobile, đóng khi đổi đường dẫn, quản lý focus |
| `components/layout/sign-out-button.tsx` | Gọi `signOut` khi bấm |
| `components/layout/current-path.tsx` | `usePathname` để hiện đường dẫn ở trang 404 mà không phải đọc `headers()` ở server |

**Thời gian thực (đồng hồ, trạng thái theo giờ hiện tại)**

| File | Lý do |
|---|---|
| `components/time/countdown-clock.tsx` | Đồng hồ NGÀY/GIỜ/PHÚT/GIÂY chạy theo giây bằng `useNow` |
| `components/time/countdown-ring.tsx` | Vòng đếm ngược ở trang chi tiết, chạy theo giây |
| `components/time/nearest-deadline.tsx` | Chọn "deadline gần nhất" theo giờ hiện tại và hiện đồng hồ |
| `components/time/next-up.tsx` | Chọn mục "Tiếp theo" và màu thanh tiến độ theo giờ hiện tại |
| `components/time/status-chip.tsx` | Chip "Quá hạn / Còn N ngày" cập nhật 60 giây một lần |
| `components/time/subject-deadline-cards.tsx` | Thẻ Quá hạn / Kế tiếp / Sắp tới của một môn, phụ thuộc giờ hiện tại |
| `components/time/subject-stats.tsx` | Số liệu của môn tính theo giờ hiện tại |
| `components/time/timeline-now.tsx` | Vạch "hôm nay" và trạng thái quá hạn của mốc trên dòng thời gian, cuộn tới vị trí hiện tại |
| `components/time/today-label.tsx` | Nhãn ngày hôm nay, phụ thuộc giờ trình duyệt |

**Bộ lọc và tiến độ**

| File | Lý do |
|---|---|
| `components/deadline/deadline-explorer.tsx` | Tìm kiếm, lọc theo môn/trạng thái, state của danh sách (thành phần client đề cho phép) |
| `components/progress/complete-toggle.tsx` | Ô tick đánh dấu xong, `useOptimistic` + `useTransition` gọi Server Action |
| `components/progress/my-status-card.tsx` | Thẻ "Trạng thái của bạn": `useSession` + tiến độ phía client + `toggleCompleteAction` |
| `components/dashboard/mark-done-button.tsx` | Nút "Đánh dấu đã xong" dùng `useActionState` gọi Server Action |
| `components/progress/progress-status-chip.tsx` | `useProgress()`: chip ở trang môn đổi thành "Đã xong" khi người đăng nhập đã tick, trang vẫn tĩnh |

**Quản trị**

| File | Lý do |
|---|---|
| `components/admin/create-deadline-form.tsx` | `useActionState`, đếm ký tự, xem trước trực tiếp khi gõ, hiện lỗi zod theo field |
| `components/admin/delete-button.tsx` | State xác nhận trước khi xoá + `useActionState` |
| `components/admin/admin-toast.tsx` | Context giữ toast ở trên bảng và form (toast không thể nằm trong dòng bị xoá) |

**UI chung**

| File | Lý do |
|---|---|
| `components/ui/toast.tsx` | Tự đóng sau ~4 giây bằng timer |
| `components/ui/copy-link-button.tsx` | Dùng Clipboard API và state "Đã sao chép" |

## Phân quyền

Ma trận quyền nằm ở **một nơi duy nhất**, `lib/permissions.ts`; middleware, page, Server Action và bảng ở trang 403 đều hỏi qua hàm `can(role, action)`.

| Action | `guest` (chưa đăng nhập) | `user` (sinh viên) | `admin` (lớp trưởng) |
|---|:---:|:---:|:---:|
| `deadline:view` (Xem deadline) | ✓ | ✓ | ✓ |
| `deadline:complete` (Đánh dấu đã xong) | ✗ | ✓ | ✓ |
| `deadline:create` (Thêm deadline) | ✗ | ✗ | ✓ |
| `deadline:delete` (Xoá deadline) | ✗ | ✗ | ✓ |

### Đăng nhập bằng GitHub

- **Chỉ bật khi có cấu hình:** provider GitHub và nút "Tiếp tục với GitHub" chỉ xuất hiện khi server có đủ `AUTH_GITHUB_ID` và `AUTH_GITHUB_SECRET` (`GITHUB_LOGIN_ENABLED` trong `lib/site.ts`). Thiếu key thì trang `/login` chỉ có form email/mật khẩu, không hiện một nút bấm vào là lỗi. `/login` là trang tĩnh nên giá trị được chốt lúc build: thêm key thì phải build lại.
- **Cấu hình:** tạo GitHub OAuth App với *Authorization callback URL* là `<SITE_URL>/api/auth/callback/github` (local: `http://localhost:3000/api/auth/callback/github`; production: `https://deadline.anhpddev.com/api/auth/callback/github`). Mỗi OAuth App chỉ có một callback URL nên local và production dùng hai app riêng. Điền `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`; Auth.js tự đọc.
- **Trạng thái production:** đã bật. `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` của OAuth App production được đặt trong env Hostinger, rồi build lại; trang `/login` hiện nút, bấm vào chuyển sang `github.com/login` với `redirect_uri=https://deadline.anhpddev.com/api/auth/callback/github` (đã kiểm ngày 2026-11-03).
- **Quyền theo email:** `auth.ts` lấy email **primary đã xác minh** của tài khoản GitHub (gọi `/user/emails`, bỏ qua email chưa xác minh). Email trùng một tài khoản trong `data/users.json` thì dùng luôn tài khoản đó (cùng `id`, vai trò, mã SV, tiến độ). Không trùng thì là `user` (sinh viên) với `id` cố định `gh-<githubId>`, không có mã SV. Không ai tự nâng lên `admin` qua GitHub được.
- **Vì sao ghép trong callback `jwt` chứ không trong `profile()`:** Auth.js gán `user.id = crypto.randomUUID()` cho user OAuth ở mỗi lần đăng nhập, nên `id` phải lấy từ `account.providerAccountId` (id GitHub) trong callback `jwt` của `auth.ts`. Callback này chạy ở Node (đọc được `users.json`); middleware vẫn chỉ dùng `auth.config.ts` (Edge-safe).
- **Lỗi:** huỷ trên GitHub hoặc OAuth lỗi thì Auth.js đưa về `/login?error=…`, form hiện thông báo tiếng Việt dưới nút GitHub.

### Ba lớp kiểm tra (defense in depth)

| Lớp | Nơi kiểm tra | Hành vi |
|---|---|---|
| 1. Middleware | `middleware.ts`, matcher `/dashboard/:path*` và `/admin/:path*`, chỉ đọc JWT ở Edge | Guest → redirect `/login?callbackUrl=…`; `user` vào `/admin` → redirect `/403` |
| 2. Page | `requirePermission()` trong `lib/session.ts`, gọi ở đầu page/layout | Kiểm tra lại session ở server, độc lập với middleware |
| 3. Server Action | `authorize()` trong `lib/actions.ts` | Thứ tự: auth → `can()` → validate (zod) → ghi → `revalidatePath` → log. `userId` luôn lấy từ session, không bao giờ lấy từ input của client |

**Server Action gọi được trực tiếp.** Mỗi Server Action là một endpoint POST, gọi được từ bất kỳ đâu bằng header `Next-Action`, không đi qua matcher của middleware. Bằng chứng (replay `deleteDeadlineAction`): khi gửi lại request xoá bằng cookie của guest hoặc của sinh viên, server trả `{}` và `data/deadlines.json` **không đổi**; với cookie của admin thì action chạy thành công. Nghĩa là lớp 3 tự bảo vệ dữ liệu dù lớp 1 và 2 bị bỏ qua.

## SEO

| Yêu cầu | Cách làm | File |
|---|---|---|
| Metadata động cho `/deadlines/[id]` | `generateMetadata` đọc deadline theo id: `title`, `description`, `canonical`, `openGraph`, `twitter:card = summary_large_image` | `app/(public)/deadlines/[id]/page.tsx` |
| Ảnh chia sẻ riêng từng deadline | Route `ImageResponse` 1200x630 vẽ tên bài, môn, hạn nộp theo màu của môn; nạp font `.ttf` để không vỡ dấu tiếng Việt | `app/(public)/deadlines/[id]/opengraph-image/route.tsx`, `assets/fonts/` |
| Ảnh chia sẻ chung | `/`, `/deadlines`, `/subjects/*` dùng chung một ảnh OG | `app/opengraph-image.tsx` |
| Sitemap gồm mọi deadline | `/`, `/deadlines`, 4 trang môn và từng `/deadlines/<id>` (đọc từ `data/deadlines.json`) | `app/sitemap.ts` |
| Robots chặn `/dashboard`, `/admin` | `disallow: ['/dashboard', '/admin']`, kèm đường dẫn sitemap | `app/robots.ts` |
| `/login`, `/dashboard` không được lập chỉ mục | `robots: { index: false, follow: false }` ở trang login và ở layout `(app)` (áp cho `/dashboard`, `/admin`); 403 và 404 cũng `noindex` | `app/(public)/login/page.tsx`, `app/(app)/layout.tsx` |
| JSON-LD `BreadcrumbList` ở trang chi tiết | Trang chủ → Deadline → tên bài; trang chủ có thêm JSON-LD `WebSite` | `components/json-ld.tsx`, `[id]/page.tsx`, `app/(public)/page.tsx` |
| `next/font` hỗ trợ tiếng Việt | 3 font `next/font/google`, subset `vietnamese` | `app/layout.tsx` |
| `next/image` | Thẻ "Khi chia sẻ link" ở trang chi tiết hiển thị ảnh OG của chính deadline bằng `<Image>` | `components/deadline/share-preview.tsx` |

## Đối chiếu yêu cầu của đề

| Mục đề | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| Dữ liệu | JSON phía server, 4 môn, ~12 deadline; 2 tài khoản bắt buộc | Đạt | `data/subjects.json` (4), `data/deadlines.json` (12), [Tài khoản thử](#tài-khoản-thử) |
| A | 6 route đúng chiến lược render | Đạt | [Kết quả build](#kết-quả-build-6-route-và-chiến-lược-render) |
| A | Id không tồn tại hiện 404 của dự án | Đạt | `/deadlines/999`, `/subjects/khong-co` gọi `notFound()` → `app/not-found.tsx`, HTTP 404 |
| B | Route group `(public)` và `(app)`, mỗi nhóm một layout | Đạt | `app/(public)/layout.tsx`, `app/(app)/layout.tsx` |
| B | `/dashboard` layout lồng (sidebar), menu tô sáng trang hiện tại | Đạt | `app/(app)/layout.tsx` (sidebar) + `app/(app)/dashboard/layout.tsx`; `sidebar-nav.tsx` dùng `usePathname` |
| B | loading, error (nút "Thử lại"), not-found | Đạt | `loading.tsx` (skeleton) ở `(app)`, `dashboard`, `admin`, `deadlines/(list)`; `app/error.tsx`, `app/(app)/dashboard/error.tsx`; `app/not-found.tsx` |
| B | Mặc định Server Component, `'use client'` chỉ ở chỗ cần tương tác | Đạt | [Danh sách file `'use client'`](#danh-sách-file-use-client-và-lý-do) |
| C | NextAuth Credentials, session JWT | Đạt | `auth.ts`: Credentials + `bcryptjs`, `session: { strategy: 'jwt' }` |
| C | `id`, `role` trong session, kiểu TS đầy đủ, role không là `string` | Đạt | `types/next-auth.d.ts`: `role: Role` (`'user' \| 'admin'`) |
| C | Header hiện tên, vai trò, nút Đăng nhập/Đăng xuất | Đạt | `components/auth/user-menu.tsx` (avatar, tên, nhãn vai trò, "Đăng xuất"; khách thấy "Đăng nhập") |
| D | Ma trận quyền một nơi, `can(role, action)` | Đạt | [Phân quyền](#phân-quyền), `lib/permissions.ts` |
| D | Middleware: chưa đăng nhập → `/login?callbackUrl=…`; user vào `/admin` → `/403` | Đạt | `middleware.ts` |
| D | `/admin` và mọi Server Action tự kiểm tra quyền; validate input | Đạt | [Ba lớp kiểm tra](#ba-lớp-kiểm-tra-defense-in-depth), zod trong `lib/validation.ts` |
| E | Metadata động, ảnh chia sẻ, sitemap, robots, noindex, JSON-LD, `next/font`, `next/image` | Đạt | [SEO](#seo) |
| E | Lighthouse trên bản production cho `/` và `/deadlines/[id]` | Đạt | [Điểm Lighthouse](#điểm-lighthouse) |
| Nộp | Không kèm `node_modules`, `.next` | Đạt | `.gitignore` |
| Nộp | README: cách chạy, ảnh build + lý do, Lighthouse, ảnh view-source, 2 câu hỏi | Đạt | Các mục trong file này |
| Điểm cộng | Test Jest cho `can()` | Đạt | [Kiểm thử](#kiểm-thử-điểm-cộng) |
| Điểm cộng | Deploy | Làm trên Hostinger thay vì Vercel (lý do ở [Deploy](#deploy-hostinger)) | https://deadline.anhpddev.com |
| Điểm cộng | Đăng nhập GitHub (OAuth) | Đạt (local và production) | [Đăng nhập bằng GitHub](#đăng-nhập-bằng-github), `auth.ts`, `__tests__/github-identity.test.ts` |

## Câu hỏi bắt buộc

### (1) Vì sao `/deadlines/[id]` dùng ISR?

- Đây là trang **công khai**, nên cần HTML tĩnh dựng sẵn cho SEO (`<title>`, `og:image`, JSON-LD), ảnh OG và tốc độ: phục vụ từ cache, không đọc file JSON ở mỗi request.
- Dữ liệu chỉ đổi khi admin thêm/xoá. `revalidatePath` làm mới đúng trang cần làm mới, đúng lúc cần: không phải SSR ở mỗi request, và cũng không phải chờ build lại như SSG thuần.
- `dynamicParams = true` cho phép id mới tạo sau khi build vẫn có trang (xem được ngay sau khi thêm). Id chưa từng tồn tại (ví dụ `/deadlines/999`) trả **HTTP 404** thật (`notFound()`).
- **Đo trên production (2026-11-03, sau khi sửa `revalidatePath`):** admin thêm deadline → `/deadlines/13` xem được ngay (`x-nextjs-cache: MISS`, dựng lần đầu), đồng thời `/`, `/subjects/co-so-du-lieu`, `/sitemap.xml` và trang chi tiết cùng môn `/deadlines/6` đều có bài mới. Admin xoá → ngay lần tải đầu `/deadlines/13` trả **HTTP 404** thật (trang 404 của dự án), các trang kia đều đã bỏ bài. Trước khi sửa, trang vẫn trả bài cũ với `x-nextjs-cache: HIT` (xem [Ghi chú kỹ thuật](#ghi-chú-kỹ-thuật)).
- **Hạn chế còn lại:** với id được dựng sẵn lúc build (1–12) rồi bị xoá, lần đo trước đợt sửa cho thấy nội dung đúng nhưng mã HTTP là 200 (soft 404). Chưa đo lại trường hợp này trên production sau khi sửa vì phải xoá dữ liệu thật.
- `revalidate = 3600` là lưới an toàn nếu có thao tác nào sót.
- Đối chiếu: `/deadlines` (danh sách) chỉ làm mới theo chu kỳ 60 giây vì chấp nhận trễ; `/deadlines/[id]` cần đúng ngay sau khi admin thao tác nên dùng ISR on-demand.

### (2) Nếu chỉ dùng Middleware bảo vệ `/admin` thì có rủi ro gì?

- Server Action là endpoint POST gọi trực tiếp được bằng header `Next-Action` từ **bất kỳ trang nào**, không đi qua matcher `/admin`. Chặn `/admin` bằng middleware không chặn được cuộc gọi trực tiếp tới action xoá/thêm.
- Matcher có thể sai hoặc bị bỏ sót khi đổi tên/thêm route.
- Từng có lỗ hổng bỏ qua middleware: **CVE-2025-29927** (header `x-middleware-subrequest` khiến Next.js bỏ qua middleware). Nếu middleware là lớp bảo vệ duy nhất thì toàn bộ khu vực quản trị mở toang.
- Middleware chạy ở Edge chỉ đọc JWT, không kiểm tra lại dữ liệu hay quyền thật tại thời điểm ghi.
- Vì vậy cần kiểm tra thêm ở **page** và **action** (phòng thủ nhiều lớp) bằng cùng hàm `can()`. Bằng chứng ở mục [Phân quyền](#phân-quyền): replay action xoá bằng guest/student trả `{}` và dữ liệu không đổi.

## Kiểm thử (điểm cộng)

```bash
npm test
```

Jest gồm **4 suite, 52 test**: `__tests__/permissions.test.ts` (ma trận `can()` theo từng cặp role + action, và `roleOf()`), `__tests__/countdown.test.ts` (hàm thời gian thuần: ranh giới 72 giờ của `statusOf`, `chipText` theo ngày lịch giờ VN, `weekBucket` với tuần bắt đầu thứ Hai, `clockParts`), `__tests__/safe-callback.test.ts` (chống open-redirect cho `callbackUrl`), `__tests__/github-identity.test.ts` (ghép tài khoản GitHub với `users.json` theo email đã xác minh, không tự nâng quyền admin). Môi trường test là `node`, cấu hình ở `jest.config.ts` (qua `next/jest`).

## Điểm Lighthouse

Đo bằng Lighthouse (CLI) trên bản production chạy local (`npm run build && npm start`, http://localhost:3000), chế độ **mobile mặc định** (mô phỏng 4G chậm + CPU chậm 4x), Chrome headless, ngày 2026-11-03. Báo cáo gốc: `lighthouse/home.report.html`, `lighthouse/deadline-1.report.html` (mở bằng trình duyệt; file HTML đã nhúng sẵn dữ liệu JSON nên không commit thêm file `.json`).

| Trang | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 79 | 100 | 100 | 100 | 5.1 s | 0 | 140 ms |
| `/deadlines/1` | 79 | 100 | 100 | 100 | 5.0 s | 0 | 160 ms |

Ghi chú trung thực: Performance dưới 90 vì LCP khoảng 4.9 s trong điều kiện mô phỏng 4G chậm + CPU chậm 4x; LCP là chữ H1 và phần lớn thời gian là chờ render (tải 18 file font). Đã thử thêm subset `latin-ext` và bỏ weight 500 nhưng số đo không đổi, nên chưa coi là đã tối ưu xong. Accessibility, Best Practices và SEO đều đạt 100. Số đo này có **trước** đợt nâng cấp chuyển động trang chủ (mục [Chuyển động và phản hồi](#chuyển-động-và-phản-hồi-ux)); chưa đo lại sau đợt đó.

## Deploy (Hostinger)

- **URL:** https://deadline.anhpddev.com (Node.js website trên Hostinger Web Hosting, cấu hình trong `.hostinger/site.json`).
- **Vì sao không dùng Vercel:** ứng dụng lưu dữ liệu bằng file JSON và ghi file khi thêm/xoá/đánh dấu xong. Vercel chạy serverless với hệ thống file **chỉ đọc** (ghi file báo lỗi `EROFS`), `/tmp` thì không bền giữa các lần gọi, nên thao tác ghi sẽ hỏng. Hostinger chạy `next start` như một server Node thật nên ghi được file và ISR on-demand (`revalidatePath`) hoạt động.
- **Biến môi trường** (chỉ ghi tên, không ghi giá trị; đặt trong hPanel/qua API **trước** khi build vì trang SSG/ISR, sitemap và `metadataBase` đọc giá trị lúc build):

  | Biến | Vai trò |
  |---|---|
  | `AUTH_SECRET` | Khoá ký JWT của Auth.js (chuỗi ngẫu nhiên riêng cho server, không dùng lại secret ở máy local) |
  | `AUTH_TRUST_HOST` | Cho Auth.js tin host khi chạy sau reverse proxy (thiếu thì lỗi `UntrustedHost`) |
  | `SITE_URL` | Gốc URL tuyệt đối (https) cho metadata, sitemap, robots, JSON-LD, `og:image` |
  | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth App **của production**, callback `https://deadline.anhpddev.com/api/auth/callback/github`. Thiếu thì nút GitHub tự ẩn |
  | `AUTH_URL` | Không cần đặt: `auth.ts` lấy theo `SITE_URL` (xem Ghi chú kỹ thuật) |
  | `DATA_DIR` | Thư mục chứa dữ liệu ghi được lúc chạy (xem bên dưới) |
  | `NODE_ENV` | `production` |

- **Vai trò của `DATA_DIR`:** mỗi lần deploy, Hostinger ghi đè thư mục code của website. `DATA_DIR` trỏ tới một thư mục **ngoài** thư mục code nên dữ liệu người dùng tạo ra không bị mất khi deploy lại. Nếu để trống (chạy local) thì dùng `./data`.
- **Cách `lib/data.ts` đọc dữ liệu:**
  - `users.json` và `subjects.json` là dữ liệu tham chiếu, luôn đọc từ thư mục code (`./data`), nên mỗi lần deploy chúng được cập nhật theo code, không bị "kẹt" bản cũ.
  - `deadlines.json`, `progress.json`, `revalidate-log.json` là dữ liệu thay đổi lúc chạy, nằm trong `DATA_DIR`. Lần đầu, file nào chưa có sẽ tự được chép từ `./data` (seed) và sau đó không bao giờ bị ghi đè.
- **Build:** script `build:hostinger` là `next build` (webpack) vì máy build của Hostinger ít RAM; `npm run build` mặc định dùng `--turbopack`. `next.config.ts` cũng giới hạn build đơn luồng (`cpus: 1`, `workerThreads: false`, `webpackBuildWorker: false`).
- **Đóng gói và upload:** Hostinger MCP từ xa không có thao tác deploy thư mục local, nên đóng gói source đã commit bằng `git archive --format=zip` (`package.json` ở gốc, không có `node_modules`, `.next`, `.env*`; thư mục `data/` phải có vì là seed), upload bằng **TUS** (archive), sau đó chạy build trên Hostinger.
- Không nộp/commit `node_modules`, `.next`, `.env.local` (đã có trong `.gitignore`).
