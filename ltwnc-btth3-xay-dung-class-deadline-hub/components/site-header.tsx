import Link from 'next/link';
import { UserMenu } from './user-menu';

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          Class Deadline Hub
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
