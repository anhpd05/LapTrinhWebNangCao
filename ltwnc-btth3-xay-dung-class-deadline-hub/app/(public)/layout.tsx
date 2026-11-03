// Chỉ là nền paper. Mỗi page tự render <main> và band tối (với <PublicHeader />) bên trong,
// vì chiều cao band khác nhau theo trang. Không gọi auth()/cookies()/headers() để route giữ tĩnh.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="motion-brand min-h-screen bg-paper">{children}</div>;
}
