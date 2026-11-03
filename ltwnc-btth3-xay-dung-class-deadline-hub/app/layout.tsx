import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Cả 3 font đều có subset `vietnamese`. Thêm `latin-ext` vì các chữ ă/đ/ơ/ư nằm trong cả range
// vietnamese lẫn latin-ext: nếu không preload thì trình duyệt phải đợi CSS rồi mới biết cần tải
// file latin-ext (đo bằng Lighthouse: Render Delay chiếm ~91% LCP).
// Bricolage Grotesque và JetBrains Mono là font biến thiên (variable font): KHÔNG khai báo
// `weight` dạng danh sách, vì Google đôi khi trả URL `/l/font?kit=…&skey=…` làm Turbopack lỗi
// "queries have exactly one entry" lúc build. Be Vietnam Pro bỏ weight 500 (chỉ 1 chỗ dùng
// font-medium, rơi về 400/600 vẫn đạt) để bớt 3 file font.
// Biến CSS đặt tên --nf-* rồi ánh xạ sang --font-sans / --font-display / --font-mono
// trong globals.css (@theme inline).
const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--nf-sans",
});

const display = Bricolage_Grotesque({
  subsets: ["vietnamese", "latin", "latin-ext"],
  display: "swap",
  variable: "--nf-display",
});

const mono = JetBrains_Mono({
  subsets: ["vietnamese", "latin", "latin-ext"],
  display: "swap",
  variable: "--nf-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Cổng theo dõi deadline các môn học của lớp.",
  openGraph: { type: "website", locale: "vi_VN", siteName: SITE_NAME },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[10px] focus:bg-lime focus:px-4 focus:py-3 focus:font-bold focus:text-ink focus:hover:text-ink"
        >
          Bỏ qua, đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
