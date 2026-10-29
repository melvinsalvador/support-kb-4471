// Which problem a report in a merged ticket shows. causes.ts tells the two flip causes apart by
// tenant and channel. A one-day move is no flip at all: only its body shows it, and the desk keeps
// those ids in desk-notes.json. Each problem has its own ticket in the tracker.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'move';

export const TRACKER = 'https://github.com/melvinsalvador/support-kb-4471/issues';
export const ISSUE: Record<Problem, number> = { parser: 1, hint: 2, move: 3 };

export const WHAT: Record<Problem | 'unplaced', string> = {
  parser: 'shared parser reads day-first dates month first',
  hint: "booking-v3's form hint says MM/DD/YYYY",
  move: 'date lands one day off across time zones',
  unplaced: 'no tenant on file',
};

export function problemOf(r: Report, t: Tenant | undefined, moved: readonly string[]): Problem | 'unplaced' {
  if (moved.includes(r.id)) return 'move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  moved: readonly string[],
): { merged: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), moved);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs.length,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports - a.reports);
  return { merged: merged.length, groups };
}
