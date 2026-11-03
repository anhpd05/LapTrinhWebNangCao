import { ACTION_LABELS, PERMISSIONS, can, type Action, type ActorRole } from '@/lib/permissions';

const ROLES: ActorRole[] = ['guest', 'user', 'admin'];
const ACTIONS = Object.keys(PERMISSIONS) as Action[];

// Bảng được sinh từ PERMISSIONS, không viết cứng lại ma trận quyền.
export function PermissionTable() {
  return (
    <figure className="flex-1 basis-80">
      <figcaption className="pb-2.5 font-mono text-xs font-bold tracking-[0.08em] text-muted-dark">
        can(role, action)
      </figcaption>
      <div className="overflow-hidden rounded-[18px] border border-line-dark bg-ink-2">
        <table aria-label="can(role, action)" className="w-full border-collapse text-sm">
          <thead>
            <tr className="font-mono text-[11px] text-muted-dark">
              <th scope="col" className="px-4 py-3 text-left font-normal">
                HÀNH ĐỘNG
              </th>
              {ROLES.map((role) => (
                <th key={role} scope="col" className="px-1.5 py-3 font-normal">
                  {role.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((action) => (
              <tr key={action} className="border-t border-line-dark">
                <th scope="row" className="px-4 py-3 text-left font-semibold">
                  {ACTION_LABELS[action]}
                </th>
                {ROLES.map((role) => {
                  const allowed = can(role, action);
                  return (
                    <td
                      key={role}
                      className={`px-1.5 py-3 text-center font-bold ${allowed ? 'text-lime' : 'text-[#8f98a8]'}`}
                    >
                      <span aria-hidden="true">{allowed ? '✓' : '✗'}</span>
                      <span className="sr-only">{allowed ? 'Được phép' : 'Không được phép'}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
