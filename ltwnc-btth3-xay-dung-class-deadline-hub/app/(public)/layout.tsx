import { SiteHeader } from '@/components/site-header';

// Không gọi auth()/cookies()/headers() ở đây để các trang public vẫn SSG/ISR.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
