import { UserMenu } from '@/components/auth/user-menu';
import { Logo } from '@/components/ui/logo';
import { PublicNav } from './public-nav';

// Server Component: không gọi auth() để trang public vẫn SSG/ISR. Trạng thái
// đăng nhập do UserMenu/PublicNav đọc ở client bằng useSession().
export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 max-sm:gap-x-3 max-sm:px-4">
      <Logo />
      <PublicNav />
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
