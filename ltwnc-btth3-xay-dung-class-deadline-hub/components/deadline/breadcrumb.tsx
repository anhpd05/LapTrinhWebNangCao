import Link from 'next/link';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#a9b1bf]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.href && !last ? (
                <Link href={item.href} className="relative text-[#c3c9d4] hover:text-white after:absolute after:-inset-y-3 after:inset-x-0 after:content-['']">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="text-[#f4f5f7]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
