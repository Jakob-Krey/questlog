import { useEffect, useState } from 'preact/hooks';
import { updateQuest, watchQuest, watchSessionsInRange } from '../lib/db';
import { useLive, useNow } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { timerElapsed, totalsByQuest, weeklyRatio, withRunningTimer } from '../lib/stats';
import { pauseQuestTimer, resumeQuestTimer, startQuestTimer, stopRunningTimer } from '../lib/timerActions';
import { formatClock, formatDuration, formatHours, periodRange } from '../lib/time';
import type { Quest, Session } from '../lib/types';
import Icon from './Icon';
import Loading from './Loading';
import Shell, { type PageProps } from './Shell';

export default function QuestFocusPage() {
  return (
    <Shell page="quest" focus>
      {(p) => <QuestFocus {...p} />}
    </Shell>
  );
}

/**
 * Ablenkungsfreie Seite einer Quest: Ziel, Wochenstand und Meilensteine, nur zum Lesen.
 * Bearbeiten gibt es nur, solange diese Quest nicht läuft.
 */
function QuestFocus({ uid, timer }: PageProps) {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') ?? '';
  const now = useNow(1000);
  const [note, setNote] = useState('');
  const week = periodRange('week', now);
  const quest = useLive<Quest | null>((cb) => watchQuest(uid, id, cb), [uid, id]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);

  // „Start“ auf der Übersicht führt hierher mit ?start=1; gestartet wird hier,
  // damit der Schreibvorgang nicht durch den Seitenwechsel verloren geht.
  useEffect(() => {
    if (!quest || params.get('start') !== '1') return;
    history.replaceState(null, '', `/quest?id=${quest.id}`);
    if (!timer && quest.status !== 'archived') startQuestTimer(uid, timer, quest);
  }, [quest?.id]);

  if (quest === undefined || sessions === undefined) return <Loading />;
  if (quest === null)
    return (
      <p>
        Quest nicht gefunden. <a href="/">Zur Übersicht</a>
      </p>
    );

  const current = timer?.questId === quest.id;
  const paused = current && timer?.pausedAt !== null;
  const actualMs = totalsByQuest(withRunningTimer(sessions, timer, now), week.from, week.to).get(quest.id) ?? 0;
  const leftMs = Math.max(0, quest.weeklyHours * 3_600_000 - actualMs);
  const ratio = weeklyRatio(actualMs, quest.weeklyHours);
  const pct = ratio === null ? null : Math.round(ratio * 100);

  // Abhaken geht auch während der Timer läuft; sonst ist hier nichts bearbeitbar.
  const toggle = (milestoneId: string, stepId?: string) =>
    updateQuest(uid, quest.id, {
      milestones: quest.milestones.map((m) =>
        m.id !== milestoneId
          ? m
          : stepId
            ? { ...m, steps: m.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)) }
            : { ...m, done: !m.done },
      ),
    }).catch((e) => reportError('Abhaken', e));

  return (
    <article class="focus-page">
      <p>
        <a href="/" class="back-link">
          <Icon name="chevron-left" />
          Übersicht
        </a>
      </p>

      <h1>{quest.name}</h1>

      {current && timer && (
        <p class={`focus-clock${paused ? ' is-paused' : ''}`}>
          <span class={`dot${paused ? ' is-paused' : ''}`} aria-hidden="true" />
          <span role="timer">{formatClock(timerElapsed(timer, now))}</span>
          {paused && <span class="muted"> pausiert</span>}
        </p>
      )}

      <p class="focus-week">
        Diese Woche <strong>{formatDuration(actualMs)}</strong>
        {quest.weeklyHours > 0 && (
          <>
            {' '}
            von {formatHours(quest.weeklyHours)}
            <span class="muted"> · {leftMs > 0 ? `noch ${formatDuration(leftMs)}` : 'Soll erfüllt'}</span>
          </>
        )}
      </p>
      {ratio !== null && (
        <div
          class="progress"
          role="progressbar"
          aria-label="Wochenfortschritt"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, pct ?? 0)}
          aria-valuetext={`${formatDuration(actualMs)} von ${formatHours(quest.weeklyHours)}, ${pct} %`}
        >
          <div style={{ width: `${Math.min(1, ratio) * 100}%` }} />
        </div>
      )}

      {quest.goal && <p class="focus-goal">{quest.goal}</p>}

      {quest.milestones.length > 0 && (
        <section>
          <h2>Meilensteine</h2>
          <ul class="focus-milestones">
            {quest.milestones.map((m) => (
              <li key={m.id}>
                <Tick done={m.done} label={m.text} strong onToggle={() => toggle(m.id)} />
                {/* Schritte nur bei offenen Meilensteinen, damit es übersichtlich bleibt. */}
                {!m.done && m.steps.length > 0 && (
                  <ol class="focus-steps" aria-label={`Schritte zu „${m.text}“`}>
                    {m.steps.map((st, i) => (
                      <li key={st.id}>
                        <Tick done={st.done} label={st.text} num={i + 1} onToggle={() => toggle(m.id, st.id)} />
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {current && timer ? (
        <form
          class="focus-actions"
          onSubmit={(e) => {
            e.preventDefault();
            stopRunningTimer(uid, timer, note);
            setNote('');
          }}
        >
          <input
            type="text"
            placeholder="Notiz (optional)"
            value={note}
            onInput={(e) => setNote(e.currentTarget.value)}
            aria-label="Notiz zur Sitzung"
          />
          <button type="button" onClick={() => (paused ? resumeQuestTimer(uid, timer) : pauseQuestTimer(uid, timer))}>
            {paused ? 'Fortsetzen' : 'Pause'}
          </button>
          <button type="submit" class="danger">
            Stopp
          </button>
        </form>
      ) : (
        <div class="focus-actions">
            <button
              class="primary"
              disabled={!!timer || quest.status === 'archived'}
              title={
                timer
                  ? `Erst „${timer.title || 'Timer'}“ stoppen.`
                  : quest.status === 'archived'
                    ? 'Archivierte Quests lassen sich nicht starten.'
                    : undefined
              }
              onClick={() => startQuestTimer(uid, timer, quest)}
            >
              Start
            </button>
          <a class="button" href={`/bearbeiten?id=${quest.id}`}>
            Bearbeiten
          </a>
        </div>
      )}
    </article>
  );
}

/** Abhakbarer Eintrag: Kreis (bei Schritten mit Nummer) und Text. */
function Tick({
  done,
  label,
  num,
  strong,
  onToggle,
}: {
  done: boolean;
  label: string;
  num?: number;
  strong?: boolean;
  onToggle: () => void;
}) {
  return (
    <button class={`tick${done ? ' done' : ''}${strong ? ' strong' : ''}`} aria-pressed={done} onClick={onToggle}>
      <span class="mark" aria-hidden="true">
        {done ? '✓' : (num ?? '')}
      </span>
      <span class="tick-text">{label}</span>
    </button>
  );
}
