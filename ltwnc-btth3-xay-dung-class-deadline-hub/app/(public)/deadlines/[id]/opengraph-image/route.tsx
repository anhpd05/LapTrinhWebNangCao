import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getDeadline, getSubjectByCode } from '@/lib/data';
import { formatDue } from '@/lib/format';

// Route handler thường (không dùng file convention opengraph-image) để URL cố định
// /deadlines/<id>/opengraph-image, không bị thêm hash; SharePreview và og:image cùng trỏ vào đây.
const size = { width: 1200, height: 630 };

function titleFontSize(title: string): number {
  if (title.length <= 36) return 76;
  if (title.length <= 60) return 64;
  if (title.length <= 90) return 52;
  return 44;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deadline = await getDeadline(id);
  if (!deadline) return new Response('Not found', { status: 404 });
  const subject = await getSubjectByCode(deadline.subjectCode);
  if (!subject) return new Response('Not found', { status: 404 });

  const fontsDir = join(process.cwd(), 'assets/fonts');
  const [display, body] = await Promise.all([
    readFile(join(fontsDir, 'BricolageGrotesque-ExtraBold.ttf')),
    readFile(join(fontsDir, 'BeVietnamPro-Bold.ttf')),
  ]);

  const accent = subject.color.c;

  // Không ghi "còn N ngày": ảnh được cache nên con số sẽ sai sau vài ngày.
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B0D12',
          color: '#F4F5F7',
          padding: 56,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'BeVietnamPro',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            top: -120,
            width: 470,
            height: 470,
            borderRadius: 9999,
            border: `54px solid ${accent}`,
          }}
        />
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 3, color: '#A9B1BF' }}>
          {`DEADLINE HUB · ${subject.code}`}
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: '82%',
            fontFamily: 'Bricolage',
            fontSize: titleFontSize(deadline.title),
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {deadline.title}
        </div>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#D4FF3A',
            color: '#0B0D12',
            fontSize: 32,
            letterSpacing: 1,
            padding: '10px 26px',
            borderRadius: 9999,
          }}
        >
          {`HẠN ${formatDue(deadline.dueAt)}`}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bricolage', data: display, weight: 800, style: 'normal' },
        { name: 'BeVietnamPro', data: body, weight: 700, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}
