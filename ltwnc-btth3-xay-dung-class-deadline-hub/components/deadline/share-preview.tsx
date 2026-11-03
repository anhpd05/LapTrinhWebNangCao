import Image from 'next/image';
import { CopyLinkButton } from '@/components/ui/copy-link-button';

interface SharePreviewProps {
  id: string;
  title: string;
}

// Xem trước thẻ chia sẻ. Ảnh là PNG do route `opengraph-image` sinh sẵn nên `unoptimized`
// (không cần qua bộ tối ưu của next/image).
export function SharePreview({ id, title }: SharePreviewProps) {
  const path = `/deadlines/${id}`;

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-line bg-card p-[18px]">
      <h2 className="font-display text-lg font-bold">Khi chia sẻ link</h2>
      <div className="overflow-hidden rounded-card border border-line">
        <Image
          src={`${path}/opengraph-image`}
          alt={`Ảnh xem trước khi chia sẻ: ${title}`}
          width={1200}
          height={630}
          sizes="320px"
          unoptimized
          className="block aspect-[1200/630] h-auto w-full bg-ink object-cover"
        />
        <div className="flex flex-col gap-0.5 bg-[#f6f7f9] px-3 py-2.5">
          <span className="break-all text-xs text-muted">{path}</span>
          <span className="text-sm font-semibold">{title} · Deadline Hub</span>
        </div>
      </div>
      <CopyLinkButton />
    </section>
  );
}
