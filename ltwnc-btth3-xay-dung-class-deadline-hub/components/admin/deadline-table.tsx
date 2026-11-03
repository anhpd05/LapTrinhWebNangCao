import Link from 'next/link';
import { SubjectTag } from '@/components/deadline/subject-tag';
import { formatDayMonth, formatDue } from '@/lib/format';
import type { Deadline, Subject } from '@/lib/types';
import { DeleteButton } from './delete-button';

export function DeadlineTable({ deadlines, subjects }: { deadlines: Deadline[]; subjects: Subject[] }) {
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const rows = [...deadlines].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));

  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-card">
      <table className="w-full min-w-[700px] border-collapse text-[15px]">
        <caption className="sr-only">Danh sách deadline và thao tác xoá</caption>
        <thead>
          <tr className="text-left font-mono text-xs tracking-[0.06em] text-muted">
            <th scope="col" className="px-[18px] py-3.5 font-normal">ID</th>
            <th scope="col" className="px-[18px] py-3.5 font-normal">TIÊU ĐỀ</th>
            <th scope="col" className="px-[18px] py-3.5 font-normal">MÔN</th>
            <th scope="col" className="px-[18px] py-3.5 font-normal">HẠN</th>
            <th scope="col" className="px-[18px] py-3.5 text-right font-normal">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => {
            const subject = subjectByCode.get(d.subjectCode);
            return (
              <tr key={d.id} className="border-t border-[#eef0f3]">
                <td className="px-[18px] py-2.5 font-mono text-[13px] text-muted">#{d.id}</td>
                <td className="px-[18px] py-2.5">
                  <Link
                    href={`/deadlines/${d.id}`}
                    className="font-semibold text-ink hover:text-ink hover:underline"
                  >
                    {d.title}
                  </Link>
                </td>
                <td className="px-[18px] py-2.5">
                  {subject ? <SubjectTag subject={subject} /> : <span className="font-mono text-xs">{d.subjectCode}</span>}
                </td>
                <td className="whitespace-nowrap px-[18px] py-2.5 font-mono text-sm">
                  {formatDayMonth(d.dueAt)} {formatDue(d.dueAt).split(' · ')[0]}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  <DeleteButton id={d.id} title={d.title} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
