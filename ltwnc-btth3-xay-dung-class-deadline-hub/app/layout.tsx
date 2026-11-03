import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Cả 3 font đều có subset `vietnamese`. Bricolage Grotesque và JetBrains Mono là font biến thiên
// (variable font): KHÔNG khai báo `weight` dạng danh sách, vì Google đôi khi trả URL
// `/l/font?kit=…&skey=…` làm Turbopack lỗi "queries have exactly one entry" lúc build.
// Biến CSS đặt tên --nf-* rồi ánh xạ sang --font-sans / --font-display / --font-mono
// trong globals.css (@theme inline).
const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--nf-sans",
});

const display = Bricolage_Grotesque({
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--nf-display",
});

const mono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--nf-mono",
});

export const metadata: Metadata = {
  title: "Class Deadline Hub",
  description: "Cổng theo dõi deadline các môn học của lớp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
