import { PriorityCard } from '@/components/dashboard/priority-card';
import { ProgressRing } from '@/components/dashboard/progress-ring';
import { TaskBoard } from '@/components/dashboard/task-board';
import { statusOf } from '@/lib/countdown';
import { getCompletedIds, getDeadlines, getSubjects } from '@/lib/data';
import { requirePermission } from '@/lib/session';

// SSR: đọc session + tiến độ riêng của người dùng, nên luôn render lúc có request.
export default async function DashboardPage() {
  const session = await requirePermission('deadline:complete', '/dashboard');
  const [deadlines, subjects, completedIds] = await Promise.all([
    getDeadlines(),
    getSubjects(),
    getCompletedIds(session.user.id),
  ]);

  const now = Date.now();
  const done = new Set(completedIds);
  const sorted = [...deadlines].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const open = sorted.filter((d) => !done.has(d.id));

  // Ưu tiên: chưa xong và chưa quá hạn, gần nhất. `sorted` đã tăng dần theo hạn.
  const focus = open.find((d) => statusOf(d.dueAt, now) !== 'late') ?? null;
  const lateCount = open.filter((d) => statusOf(d.dueAt, now) === 'late').length;
  const doneCount = deadlines.length - open.length;

  return (
    <>
      <div className="flex flex-wrap gap-4">
        <PriorityCard
          deadline={focus}
          subject={subjects.find((s) => s.code === focus?.subjectCode)}
          renderedAt={now}
        />
        <ProgressRing done={doneCount} total={deadlines.length} lateCount={lateCount} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-[28px] font-extrabold">Bảng việc</h2>
        <span className="text-sm text-muted">Tick để chuyển thẻ sang “Đã xong”</span>
      </div>
      <TaskBoard deadlines={deadlines} subjects={subjects} completedIds={completedIds} now={now} />
    </>
  );
}
