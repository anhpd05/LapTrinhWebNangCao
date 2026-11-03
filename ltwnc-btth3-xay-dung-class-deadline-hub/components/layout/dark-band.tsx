// Band tối có lưới 48px; mỗi page tự quyết định chiều cao bằng nội dung bên trong.
export function DarkBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink text-[#f4f5f7]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(#171B24 1px, transparent 1px), linear-gradient(90deg, #171B24 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
