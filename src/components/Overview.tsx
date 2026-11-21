import { useState } from 'preact/hooks';
import { createQuest, watchQuests, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { behindMs, paceStatus, totalsByQuest, weeklyRatio, type Pace } from '../lib/stats';
import { startQuestTimer, stopRunningTimer } from '../lib/timerActions';
import { formatDuration, formatHours, periodRange } from '../lib/time';
import type { ActiveTimer, Quest, Session } from '../lib/types';
import Loading from './Loading';
import Shell, { type PageProps } from './Shell';

export default function OverviewPage() {
  return <Shell page="uebersicht">{(p) => <Overview {...p} />}</Shell>;
}

function Overview({ uid, timer }: PageProps) {
  const now = useNow(30_000);
  const week = periodRange('week', now);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);

  if (!quests || !sessions) return <Loading />;

  // Laufenden Timer live einrechnen; sortiert wird nur nach gespeicherten Sitzungen,
  // damit Karten nicht während der Arbeit die Plätze tauschen.
  const saved = totalsByQuest(sessions, week.from, week.to);
  const entries = timer ? [...sessions, { questId: timer.questId, start: timer.startedAt, end: now }] : sessions;
  const totals = totalsByQuest(entries, week.from, week.to);
  const elapsed = (now - week.from) / (week.to - week.from);

  const sortKey = (q: Quest) => weeklyRatio(saved.get(q.id) ?? 0, q.weeklyHours) ?? Number.POSITIVE_INFINITY;
  // Eine pausierte Quest mit laufendem Timer bleibt sichtbar, damit sie stoppbar ist.
  const cards = quests
    .filter((q) => q.status === 'active' || q.id === timer?.questId)
    .sort((a, b) => sortKey(a) - sortKey(b));
  const paused = quests.filter((q) => q.status === 'paused' && q.id !== timer?.questId);
  const archived = quests.filter((q) => q.status === 'archived' && q.id !== timer?.questId);

  return (
    <>
      <h1 class="sr-only">Quests</h1>

      {cards.length === 0 ? (
        quests.length === 0 ? (
          <FirstQuest uid={uid} />
        ) : (
          <>
            <p class="muted">Gerade ist keine Quest aktiv. Setze eine pausierte Quest wieder auf aktiv oder leg eine neue an.</p>
            <NewQuest uid={uid} />
          </>
        )
      ) : (
        <>
          <div class="cards">
            {cards.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                actualMs={totals.get(q.id) ?? 0}
                elapsed={elapsed}
                timer={timer}
                onStart={() => startQuestTimer(uid, timer, q)}
                onStop={() => timer && stopRunningTimer(uid, timer)}
              />
            ))}
          </div>
          <NewQuest uid={uid} />
        </>
      )}

      {paused.length > 0 && <QuestLinks title="Pausiert" quests={paused} />}
      {archived.length > 0 && <QuestLinks title="Archiviert" quests={archived} />}
    </>
  );
}

const PACE_TEXT: Record<Pace, string> = { done: 'Soll erfüllt', 'on-track': 'Im Plan', behind: '' };

interface CardProps {
  quest: Quest;
  actualMs: number;
  elapsed: number;
  timer: ActiveTimer | null;
  onStart: () => void;
  onStop: () => void;
}

export function QuestCard({ quest, actualMs, elapsed, timer, onStart, onStop }: CardProps) {
  const running = timer?.questId === quest.id;
  const ratio = weeklyRatio(actualMs, quest.weeklyHours);
  const pace = paceStatus(actualMs, quest.weeklyHours, elapsed);
  const pct = ratio === null ? null : Math.round(ratio * 100);
  const hours = formatHours(quest.weeklyHours);
  const doneCount = quest.milestones.filter((m) => m.done).length;
  const nextIndex = quest.milestones.findIndex((m) => !m.done);

  const paceText =
    pace === null
      ? 'Kein Wochen-Soll'
      : pace === 'behind'
        ? `${formatDuration(behindMs(actualMs, quest.weeklyHours, elapsed))} hinter Plan`
        : PACE_TEXT[pace];

  return (
    <article class={`card${running ? ' is-running' : ''}`}>
      <a href={`/quest?id=${quest.id}`} class="card-title" title={quest.name}>
        {quest.name}
      </a>
      {quest.goal && (
        <p class="goal" title={quest.goal}>
          {quest.goal}
        </p>
      )}

      <div class="card-figures">
        {actualMs > 0 ? (
          <p class="figure">
            <span class="figure-ist">{formatDuration(actualMs)}</span>
            {ratio !== null && <span class="muted"> von {hours}</span>}
          </p>
        ) : (
          <p class="figure muted">Noch nichts diese Woche{ratio !== null && ` · Soll ${hours}`}</p>
        )}
        {pct !== null && <span class={`pct pace-${pace}`}>{pct} %</span>}
      </div>

      {ratio !== null && (
        <div
          class="progress"
          role="progressbar"
          aria-label={`${quest.name}: Wochenfortschritt`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, pct ?? 0)}
          aria-valuetext={`${formatDuration(actualMs)} von ${hours}, ${pct} %`}
        >
          <div style={{ width: `${Math.min(1, ratio) * 100}%` }} />
        </div>
      )}

      <p class={`meta pace-${pace}`}>{paceText}</p>
      {quest.milestones.length > 0 && (
        <p class="meta next-milestone" title={nextIndex >= 0 ? quest.milestones[nextIndex].text : undefined}>
          {nextIndex >= 0
            ? `Meilenstein ${doneCount + 1}/${quest.milestones.length}: ${quest.milestones[nextIndex].text}`
            : quest.milestones.length === 1
              ? 'Meilenstein erledigt'
              : `Alle ${quest.milestones.length} Meilensteine erledigt`}
        </p>
      )}

      <div class="card-actions">
        {running ? (
          <>
            <button class="danger" onClick={onStop}>
              Stopp
            </button>
            <span class="running-label">
              <span class="dot" aria-hidden="true" />
              läuft
            </span>
          </>
        ) : (
          <button onClick={onStart} aria-label={`${timer ? 'Wechseln zu' : 'Start'} ${quest.name}`}>
            {timer ? 'Wechseln' : 'Start'}
          </button>
        )}
      </div>
    </article>
  );
}

export function FirstQuest({ uid }: { uid: string }) {
  return (
    <section class="panel onboard">
      <h2>Leg deine erste Quest an</h2>
      <p>
        Eine Quest ist ein großes Vorhaben ohne Enddatum – ein Studienabschnitt, ein Kundenprojekt, ein persönliches
        Ziel. Du legst fest, wie viele Stunden pro Woche du hineinstecken willst, und siehst hier jede Woche Ist gegen
        Soll.
      </p>
      <QuestForm uid={uid} />
    </section>
  );
}

function NewQuest({ uid }: { uid: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <p>
        <button onClick={() => setOpen(true)}>+ Neue Quest</button>
      </p>
    );
  return (
    <section class="panel">
      <h2>Neue Quest</h2>
      <QuestForm uid={uid} onDone={() => setOpen(false)} />
    </section>
  );
}

function QuestForm({ uid, onDone }: { uid: string; onDone?: () => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('5');
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      class="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const weeklyHours = Number(hours.replace(',', '.'));
        if (!name.trim()) return setError('Bitte gib der Quest einen Namen.');
        if (!(weeklyHours > 0)) return setError('Bitte ein Wochen-Soll über 0 Stunden angeben.');
        // Lokal sofort sichtbar (auch offline); scheitert der Server, gibt es eine Meldung.
        createQuest(uid, { name: name.trim(), goal: goal.trim(), weeklyHours }).saved.catch((err) =>
          reportError(`Anlegen von „${name.trim()}“`, err),
        );
        setName('');
        setGoal('');
        setHours('5');
        setError(null);
        onDone?.();
      }}
    >
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
        Wochen-Soll in Stunden
        <input
          type="number"
          required
          min={0.5}
          step={0.5}
          inputMode="decimal"
          value={hours}
          onInput={(e) => setHours(e.currentTarget.value)}
        />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <div class="row">
        <button type="submit" class="primary">
          Quest anlegen
        </button>
        {onDone && (
          <button type="button" class="link" onClick={onDone}>
            Abbrechen
          </button>
        )}
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
