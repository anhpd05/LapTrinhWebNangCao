import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site';

// Ảnh chia sẻ chung (og:image) cho các trang không tự có ảnh: /, /deadlines, /subjects/*.
// /deadlines/[id] vẫn dùng ảnh riêng ở route opengraph-image của nó.
// Không ghi số deadline: ảnh được cache nên con số sẽ sai khi lớp trưởng thêm/xoá.
export const alt = `${SITE_NAME}: mọi deadline của lớp trên một dòng thời gian`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PINS = [
  { left: 160, color: '#7C9CFF' },
  { left: 380, color: '#3DDC97' },
  { left: 610, color: '#FFB547' },
  { left: 830, color: '#C3A6FF' },
];

export default async function OpengraphImage() {
  const fontsDir = join(process.cwd(), 'assets/fonts');
  const [display, body] = await Promise.all([
    readFile(join(fontsDir, 'BricolageGrotesque-ExtraBold.ttf')),
    readFile(join(fontsDir, 'BeVietnamPro-Bold.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B0D12',
          color: '#F4F5F7',
          padding: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'BeVietnamPro',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D4FF3A' }} />
          {SITE_NAME}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Bricolage', fontSize: 84, lineHeight: 1 }}>
          <span>Mọi deadline của lớp.</span>
          <span style={{ color: '#D4FF3A' }}>Một dòng thời gian.</span>
        </div>
        <div style={{ display: 'flex', position: 'relative', height: 44 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 21, height: 2, background: '#262B36' }} />
          <div style={{ position: 'absolute', left: 500, top: 0, width: 4, height: 44, background: '#D4FF3A' }} />
          {PINS.map((p) => (
            <div
              key={p.left}
              style={{ position: 'absolute', left: p.left, top: 8, width: 60, height: 28, borderRadius: 999, background: p.color }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bricolage', data: display, weight: 800 },
        { name: 'BeVietnamPro', data: body, weight: 700 },
      ],
    },
  );
}
