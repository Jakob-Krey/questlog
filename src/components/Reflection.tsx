import { useEffect, useState } from 'preact/hooks';
import { saveReflection, watchQuests, watchReflections, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { totalsByQuest, withRunningTimer } from '../lib/stats';
import { formatDuration, isoWeek, periodRange } from '../lib/time';
import type { Quest, Reflection as R, Session } from '../lib/types';
import Loading from './Loading';
import PeriodNav from './PeriodNav';
import Shell, { type PageProps } from './Shell';

export default function ReflectionPage() {
  return <Shell page="reflexion">{(p) => <Reflection {...p} />}</Shell>;
}

function Reflection({ uid, timer }: PageProps) {
  const [refDate, setRefDate] = useState(new Date());
  const now = useNow(30_000);
  const week = periodRange('week', refDate);
  const kw = isoWeek(week.from);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);
  const reflections = useLive<R[]>((cb) => watchReflections(uid, kw, cb), [uid, kw]);

  if (!quests || !sessions || !reflections) return <Loading />;

  const entries = withRunningTimer(sessions, timer, now);
  const totals = totalsByQuest(entries, week.from, week.to);
  // Aktive Quests plus alle, zu denen es in dieser Woche schon eine Reflexion gibt.
  const shown = quests.filter((q) => q.status === 'active' || reflections.some((r) => r.questId === q.id));

  return (
    <>
      <h1>Wochenreflexion</h1>
      <PeriodNav kind="week" refDate={refDate} onChange={setRefDate} />
      {shown.length === 0 && <p class="muted">Keine aktiven Quests.</p>}
      {shown.map((q) => (
        <ReflectionCard
          key={`${q.id}_${kw}`}
          uid={uid}
          quest={q}
          kw={kw}
          actualMs={totals.get(q.id) ?? 0}
          reflection={reflections.find((r) => r.questId === q.id)}
        />
      ))}
    </>
  );
}

interface CardProps {
  uid: string;
  quest: Quest;
  kw: string;
  actualMs: number;
  reflection?: R;
}

function ReflectionCard({ uid, quest, kw, actualMs, reflection }: CardProps) {
  const [text, setText] = useState(reflection?.text ?? '');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Stand von anderen Geräten übernehmen, solange hier nichts ungespeichert ist.
  useEffect(() => {
    if (!dirty) setText(reflection?.text ?? '');
  }, [reflection?.text]);

  const target = quest.weeklyHours * 3_600_000;
  const diff = actualMs - target;

  return (
    <form
      class="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        saveReflection(uid, quest.id, kw, text).catch((err) => reportError(`Speichern der Reflexion „${quest.name}“`, err));
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }}
    >
      <div class="row spread">
        <h2>{quest.name}</h2>
        <span class={diff >= 0 ? 'ok' : 'muted'}>
          Ist {formatDuration(actualMs)} / Soll {quest.weeklyHours} h
        </span>
      </div>
      <textarea
        rows={3}
        value={text}
        placeholder="Wie lief die Woche für diese Quest?"
        aria-label={`Reflexion ${quest.name}`}
        onInput={(e) => {
          setText(e.currentTarget.value);
          setDirty(true);
        }}
      />
      <div class="row">
        <button type="submit" class="primary" disabled={!dirty}>
          Speichern
        </button>
        {saved && (
          <span class="muted" role="status">
            Gespeichert
          </span>
        )}
      </div>
    </form>
  );
}
