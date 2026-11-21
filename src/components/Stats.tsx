import { useState } from 'preact/hooks';
import { watchQuests, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { FREE_KEY, totalsByQuest } from '../lib/stats';
import { formatDuration, periodRange, type PeriodKind } from '../lib/time';
import type { Quest, Session } from '../lib/types';
import Loading from './Loading';
import PeriodNav from './PeriodNav';
import Shell, { type PageProps } from './Shell';

export default function StatsPage() {
  return <Shell page="auswertung">{(p) => <Stats {...p} />}</Shell>;
}

const KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: 'week', label: 'Woche' },
  { kind: 'month', label: 'Monat' },
  { kind: 'quarter', label: 'Quartal' },
];

function Stats({ uid, timer }: PageProps) {
  const [kind, setKind] = useState<PeriodKind>('week');
  const [refDate, setRefDate] = useState(new Date());
  const now = useNow(30_000);
  const range = periodRange(kind, refDate);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, range.from, range.to, cb), [uid, range.from, range.to]);

  if (!quests || !sessions) return <Loading />;

  const entries = timer ? [...sessions, { questId: timer.questId, start: timer.startedAt, end: now }] : sessions;
  const totals = totalsByQuest(entries, range.from, range.to);
  const rows = [...totals.entries()]
    .map(([key, ms]) => ({
      key,
      ms,
      name: key === FREE_KEY ? 'Ohne Quest' : (quests.find((q) => q.id === key)?.name ?? 'Gelöschte Quest'),
    }))
    .sort((a, b) => b.ms - a.ms);
  const sum = rows.reduce((acc, r) => acc + r.ms, 0);
  const max = rows[0]?.ms ?? 0;

  return (
    <>
      <h1>Auswertung</h1>
      <div class="row">
        <div class="segmented" role="group" aria-label="Zeitraum">
          {KINDS.map((k) => (
            <button class={k.kind === kind ? 'active' : ''} aria-pressed={k.kind === kind} onClick={() => setKind(k.kind)}>
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <PeriodNav kind={kind} refDate={refDate} onChange={setRefDate} />

      {rows.length === 0 ? (
        <p class="muted">Keine erfasste Zeit in diesem Zeitraum.</p>
      ) : (
        <table class="stats">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.name}</th>
                <td class="bar-cell">
                  <div class="bar" style={{ width: `${max ? (r.ms / max) * 100 : 0}%` }} />
                </td>
                <td class="num">{formatDuration(r.ms)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Gesamt</th>
              <td />
              <td class="num">{formatDuration(sum)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </>
  );
}
