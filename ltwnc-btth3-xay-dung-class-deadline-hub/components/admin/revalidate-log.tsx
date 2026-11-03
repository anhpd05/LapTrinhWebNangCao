import { getRevalidateLog } from '@/lib/data';
import { formatDue } from '@/lib/format';

/** "Nhật ký làm mới trang": 5 dòng gần nhất, đọc từ data/revalidate-log.json lúc SSR. */
export async function RevalidateLog() {
  const entries = await getRevalidateLog(5);

  return (
    <section aria-labelledby="revalidate-log-title" className="flex flex-col gap-2 rounded-[18px] border border-line bg-card p-4">
      <h2 id="revalidate-log-title" className="font-bold">
        Nhật ký làm mới trang
      </h2>
      {entries.length === 0 ? (
        <p className="border-t border-[#eef0f3] pt-2 text-[13px] text-muted">Chưa có lần làm mới nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.at + e.text} className="flex items-baseline gap-3 border-t border-[#eef0f3] pt-2 text-[13px]">
              <time dateTime={e.at} className="flex-none font-mono text-muted">
                {formatDue(e.at).split(' · ')[0]}
              </time>
              <span className="min-w-0 [overflow-wrap:anywhere]">{e.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
