<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { ISSUE, TRACKER, WHAT, problemsIn } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code> {WHAT[g.problem]}</td>
        <td>{g.reports}</td>
        <td>{g.tenants}</td>
        <td class="ch">{channels(g.channels)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.problem !== 'unplaced'}<a href="{TRACKER}/{ISSUE[g.problem]}">#{ISSUE[g.problem]}</a>{:else}none{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .ch { color: var(--muted); font-size: 0.85em; }
</style>
