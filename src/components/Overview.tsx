import { useEffect, useRef, useState } from 'preact/hooks';
import { createQuest, watchQuests, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { paceStatus, timerElapsed, totalsByQuest, weeklyRatio, withRunningTimer } from '../lib/stats';
import { pauseQuestTimer, resumeQuestTimer, startQuestTimer, stopRunningTimer } from '../lib/timerActions';
import { formatClock, formatDuration, formatHours, periodRange } from '../lib/time';
import type { ActiveTimer, Quest, Session } from '../lib/types';
import Icon from './Icon';
import Loading from './Loading';
import Shell, { type PageProps } from './Shell';

export default function OverviewPage() {
  return <Shell page="uebersicht">{(p) => <Overview {...p} />}</Shell>;
}

function Overview({ uid, timer }: PageProps) {
  const now = useNow(30_000);
  const week = periodRange('week', now);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const [openId, setOpenId] = useState<string | null>(null);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);

  if (!quests || !sessions) return <Loading />;

  // Laufenden Timer live einrechnen; sortiert wird nur nach gespeicherten Sitzungen,
  // damit Karten nicht während der Arbeit die Plätze tauschen.
  const saved = totalsByQuest(sessions, week.from, week.to);
  const entries = withRunningTimer(sessions, timer, now);
  const totals = totalsByQuest(entries, week.from, week.to);
  const elapsed = (now - week.from) / (week.to - week.from);

  const sortKey = (q: Quest) => weeklyRatio(saved.get(q.id) ?? 0, q.weeklyHours) ?? Number.POSITIVE_INFINITY;
  // Eine pausierte Quest mit laufendem Timer bleibt sichtbar, damit sie stoppbar ist.
  const cards = quests
    .filter((q) => q.status === 'active' || q.id === timer?.questId)
    .sort((a, b) => sortKey(a) - sortKey(b));
  const paused = quests.filter((q) => q.status === 'paused' && q.id !== timer?.questId);
  const archived = quests.filter((q) => q.status === 'archived' && q.id !== timer?.questId);
  const openQuest = quests.find((q) => q.id === openId) ?? null;

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
                onOpen={() => setOpenId(q.id)}
                onStart={() => {
                  startQuestTimer(uid, timer, q);
                  setOpenId(q.id);
                }}
                onStop={() => timer && stopRunningTimer(uid, timer)}
                onPause={() => timer && pauseQuestTimer(uid, timer)}
                onResume={() => timer && resumeQuestTimer(uid, timer)}
              />
            ))}
          </div>
          <NewQuest uid={uid} />
        </>
      )}

      {openQuest && (
        <QuestWindow
          uid={uid}
          quest={openQuest}
          actualMs={totals.get(openQuest.id) ?? 0}
          timer={timer}
          onClose={() => setOpenId(null)}
        />
      )}

      {paused.length > 0 && <QuestLinks title="Pausiert" quests={paused} />}
      {archived.length > 0 && <QuestLinks title="Archiviert" quests={archived} />}
    </>
  );
}

interface CardProps {
  quest: Quest;
  actualMs: number;
  elapsed: number;
  timer: ActiveTimer | null;
  onOpen: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function QuestCard({ quest, actualMs, elapsed, timer, onOpen, onStart, onStop, onPause, onResume }: CardProps) {
  const current = timer?.questId === quest.id;
  const paused = current && timer?.pausedAt !== null;
  const running = current && !paused;
  const ratio = weeklyRatio(actualMs, quest.weeklyHours);
  const pace = paceStatus(actualMs, quest.weeklyHours, elapsed);
  const pct = ratio === null ? null : Math.round(ratio * 100);
  const hours = formatHours(quest.weeklyHours);
  const doneCount = quest.milestones.filter((m) => m.done).length;
  const nextIndex = quest.milestones.findIndex((m) => !m.done);

  return (
    <article
      class={`card${running ? ' is-running' : ''}${paused ? ' is-paused' : ''}`}
      // Klick irgendwo auf die Karte öffnet das Fenster; Buttons behalten ihre eigene Aktion.
      onClick={(e) => !(e.target as HTMLElement).closest('button') && onOpen()}
    >
      <button class="card-title" title={quest.name} onClick={onOpen}>
        {quest.name}
      </button>
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
        {current ? (
          <>
            <button onClick={paused ? onResume : onPause} aria-label={`${paused ? 'Fortsetzen' : 'Pause'}: ${quest.name}`}>
              {paused ? 'Fortsetzen' : 'Pause'}
            </button>
            <button class="danger" onClick={onStop} aria-label={`Stopp: ${quest.name}`}>
              Stopp
            </button>
            <span class="running-label">
              <span class={`dot${paused ? ' is-paused' : ''}`} aria-hidden="true" />
              {paused ? 'pausiert' : 'läuft'}
            </span>
          </>
        ) : (
          <button
            onClick={onStart}
            disabled={!!timer}
            title={timer ? `Erst „${timer.title || 'Timer'}“ stoppen.` : undefined}
            aria-label={`Start ${quest.name}`}
          >
            Start
          </button>
        )}
      </div>
    </article>
  );
}

interface WindowProps {
  uid: string;
  quest: Quest;
  actualMs: number;
  timer: ActiveTimer | null;
  onClose: () => void;
}

/**
 * Schlichtes Fenster einer Quest: Ziel, Wochenstand und Meilensteine, nur zum Lesen.
 * Bearbeiten gibt es nur, solange diese Quest nicht läuft.
 */
function QuestWindow({ uid, quest, actualMs, timer, onClose }: WindowProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const clock = useNow(1000);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const current = timer?.questId === quest.id;
  const paused = current && timer?.pausedAt !== null;
  const goalMs = quest.weeklyHours * 3_600_000;
  const leftMs = Math.max(0, goalMs - actualMs);

  return (
    <dialog
      ref={ref}
      class="quest-window"
      aria-labelledby="quest-window-title"
      onClose={onClose}
      // Klick auf den abgedunkelten Hintergrund schließt.
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div class="qw-inner">
        <div class="qw-head">
          <h2 id="quest-window-title">{quest.name}</h2>
          <button class="icon" aria-label="Schließen" title="Schließen" onClick={() => ref.current?.close()}>
            <Icon name="x" />
          </button>
        </div>

        {current && timer && (
          <p class={`qw-clock${paused ? ' is-paused' : ''}`}>
            <span class={`dot${paused ? ' is-paused' : ''}`} aria-hidden="true" />
            <span role="timer">{formatClock(timerElapsed(timer, clock))}</span>
            {paused && <span class="muted"> pausiert</span>}
          </p>
        )}

        <p class="qw-week">
          {quest.weeklyHours > 0 ? (
            <>
              Diese Woche <strong>{formatDuration(actualMs)}</strong> von {formatHours(quest.weeklyHours)}
              <span class="muted"> · {leftMs > 0 ? `noch ${formatDuration(leftMs)}` : 'Soll erfüllt'}</span>
            </>
          ) : (
            <>Diese Woche <strong>{formatDuration(actualMs)}</strong></>
          )}
        </p>

        {quest.goal && <p class="qw-goal">{quest.goal}</p>}

        {quest.milestones.length > 0 && (
          <section>
            <h3>Meilensteine</h3>
            <ol class="qw-milestones">
              {quest.milestones.map((m) => (
                <li key={m.id} class={m.done ? 'done' : ''}>
                  <span class="qw-mark" aria-hidden="true">{m.done ? '✓' : ''}</span>
                  <span>
                    {m.text}
                    {m.done && <span class="sr-only"> (erledigt)</span>}
                    {/* Unterschritte nur bei offenen Meilensteinen, damit es übersichtlich bleibt. */}
                    {!m.done && m.steps.length > 0 && (
                      <ul class="qw-steps">
                        {m.steps.map((st) => (
                          <li key={st.id} class={st.done ? 'done' : ''}>
                            <span class="qw-mark" aria-hidden="true">{st.done ? '✓' : ''}</span>
                            <span>
                              {st.text}
                              {st.done && <span class="sr-only"> (erledigt)</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div class="qw-actions">
          {current && timer ? (
            <>
              <button onClick={() => (paused ? resumeQuestTimer(uid, timer) : pauseQuestTimer(uid, timer))}>
                {paused ? 'Fortsetzen' : 'Pause'}
              </button>
              <button
                class="danger"
                onClick={() => {
                  stopRunningTimer(uid, timer);
                  ref.current?.close();
                }}
              >
                Stopp
              </button>
            </>
          ) : (
            <>
              <button
                class="primary"
                disabled={!!timer}
                title={timer ? `Erst „${timer.title || 'Timer'}“ stoppen.` : undefined}
                onClick={() => startQuestTimer(uid, timer, quest)}
              >
                Start
              </button>
              <a class="button" href={`/quest?id=${quest.id}`}>
                Bearbeiten
              </a>
            </>
          )}
        </div>
      </div>
    </dialog>
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
