import { useState } from 'preact/hooks';
import { createQuest, startTimer, watchQuests, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { totalsByQuest, weeklyProgress } from '../lib/stats';
import { formatDuration, periodRange } from '../lib/time';
import type { Quest, Session } from '../lib/types';
import Shell, { type PageProps } from './Shell';

export default function OverviewPage() {
  return <Shell page="uebersicht">{(p) => <Overview {...p} />}</Shell>;
}

function Overview({ uid, timer }: PageProps) {
  const now = useNow(30_000);
  const week = periodRange('week', now);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);

  if (!quests || !sessions) return <p class="muted">Lädt …</p>;

  // Laufenden Timer live in den Wochenfortschritt einrechnen.
  const entries = timer ? [...sessions, { questId: timer.questId, start: timer.startedAt, end: now }] : sessions;
  const totals = totalsByQuest(entries, week.from, week.to);

  const active = quests.filter((q) => q.status === 'active');
  const paused = quests.filter((q) => q.status === 'paused');
  const archived = quests.filter((q) => q.status === 'archived');

  return (
    <>
      <h1>Aktive Quests</h1>
      {active.length === 0 && <p class="muted">Noch keine aktive Quest. Leg unten deine erste an.</p>}
      <div class="cards">
        {active.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            actualMs={totals.get(q.id) ?? 0}
            running={timer?.questId === q.id}
            onStart={() =>
              startTimer(uid, timer, { questId: q.id, title: q.name }).catch((e) => alert(e.message ?? e))
            }
          />
        ))}
      </div>

      <NewQuest uid={uid} />

      {paused.length > 0 && <QuestLinks title="Pausiert" quests={paused} />}
      {archived.length > 0 && <QuestLinks title="Archiviert" quests={archived} />}
    </>
  );
}

function QuestCard(props: { quest: Quest; actualMs: number; running: boolean; onStart: () => void }) {
  const { quest, actualMs, running, onStart } = props;
  const progress = weeklyProgress(actualMs, quest.weeklyHours);
  const done = quest.milestones.filter((m) => m.done).length;
  return (
    <article class={`card ${running ? 'is-running' : ''}`}>
      <a href={`/quest?id=${quest.id}`} class="card-title">
        {quest.name}
      </a>
      {quest.goal && <p class="goal">{quest.goal}</p>}
      <div class="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${progress * 100}%` }} />
      </div>
      <p class="meta">
        {formatDuration(actualMs)} von {quest.weeklyHours} h diese Woche
        {quest.milestones.length > 0 && ` · Meilensteine ${done}/${quest.milestones.length}`}
      </p>
      <button class={running ? '' : 'primary'} disabled={running} onClick={onStart}>
        {running ? 'Läuft …' : 'Start'}
      </button>
    </article>
  );
}

function NewQuest({ uid }: { uid: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('5');

  if (!open)
    return (
      <p>
        <button onClick={() => setOpen(true)}>+ Neue Quest</button>
      </p>
    );

  return (
    <form
      class="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        // Nicht sofort wegnavigieren: Der Schreibvorgang soll erst im lokalen Cache landen.
        createQuest(uid, {
          name: name.trim(),
          goal: goal.trim(),
          weeklyHours: Math.max(0, Number(hours) || 0),
        });
        setName('');
        setGoal('');
        setHours('5');
        setOpen(false);
      }}
    >
      <h2>Neue Quest</h2>
      <label>
        Name
        <input required value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="z. B. Masterarbeit" />
      </label>
      <label>
        SMART-Ziel (ohne Enddatum)
        <textarea
          rows={3}
          value={goal}
          onInput={(e) => setGoal(e.currentTarget.value)}
          placeholder="Spezifisch, messbar, attraktiv, realistisch – woran erkennst du, dass du es geschafft hast?"
        />
      </label>
      <label>
        Wochenstunden (Soll)
        <input type="number" min={0} step={0.5} value={hours} onInput={(e) => setHours(e.currentTarget.value)} />
      </label>
      <div class="row">
        <button type="submit" class="primary">
          Anlegen
        </button>
        <button type="button" class="link" onClick={() => setOpen(false)}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function QuestLinks({ title, quests }: { title: string; quests: Quest[] }) {
  return (
    <details class="panel">
      <summary>
        {title} ({quests.length})
      </summary>
      <ul class="plain">
        {quests.map((q) => (
          <li key={q.id}>
            <a href={`/quest?id=${q.id}`}>{q.name}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
