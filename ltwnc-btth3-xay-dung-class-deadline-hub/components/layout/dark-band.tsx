// Band tối có lưới 48px (mờ dần về phía dưới) và một quầng sáng lime trôi chậm;
// mỗi page tự quyết định chiều cao bằng nội dung bên trong.
export function DarkBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink text-on-dark">
      <div
        aria-hidden="true"
        className="band-grid absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(#171B24 1px, transparent 1px), linear-gradient(90deg, #171B24 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div aria-hidden="true" className="band-glow -left-[10%] -top-[30%] size-[720px]" />
      <div className="relative">{children}</div>
    </section>
  );
}
