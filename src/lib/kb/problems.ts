// The problems in a merged ticket, counted the desk's way. causes.ts tells the two flip causes
// apart by tenant and channel. A one-day move is no flip at all: only its body shows it, and the
// desk keeps those ids in desk-notes.json. Like CauseTable, a moved report is counted where it is
// filed, by tenant, and its own problem says where that is. Each problem has its own ticket.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'move';

export const TRACKER = 'https://github.com/melvinsalvador/support-kb-4471/issues';
export const ISSUE: Record<Problem, number> = { parser: 1, hint: 2, move: 3 };

export const WHAT: Record<Problem | 'unplaced', string> = {
  parser: 'shared parser reads day-first dates month first',
  hint: "booking-v3's form hint says MM/DD/YYYY",
  move: 'date lands one day off across time zones',
  unplaced: 'no tenant on file',
};

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Set on `move`: the causes its reports are filed and counted under.
  filedUnder?: (Cause | 'unplaced')[];
};

function group(problem: ProblemGroup['problem'], rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs.length,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  moved: readonly string[],
): { merged: number; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const filed = (r: Report) => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byCause = new Map<Cause | 'unplaced', Report[]>();
  for (const r of merged) byCause.set(filed(r), [...(byCause.get(filed(r)) ?? []), r]);
  const groups = [...byCause.entries()].map(([cause, rs]) => group(cause, rs)).sort((a, b) => b.reports - a.reports);

  const moves = merged.filter((r) => moved.includes(r.id));
  if (moves.length) groups.push({ ...group('move', moves), filedUnder: [...new Set(moves.map(filed))] });
  return { merged: merged.length, groups };
}
