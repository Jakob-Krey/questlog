import { useEffect, useState } from 'preact/hooks';
import { updateQuest, watchQuest, watchQuestSessions } from '../lib/db';
import { useLive } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { pauseQuestTimer, resumeQuestTimer, startQuestTimer, stopRunningTimer } from '../lib/timerActions';
import { formatDuration, workedMs } from '../lib/time';
import { STATUS_LABEL, type Milestone, type Quest, type QuestStatus, type Session, type Step } from '../lib/types';
import Icon from './Icon';
import Loading from './Loading';
import Shell, { type PageProps } from './Shell';

export default function QuestEditPage() {
  return <Shell page="quest">{(p) => <QuestEdit {...p} />}</Shell>;
}

function QuestEdit({ uid, timer }: PageProps) {
  const id = new URLSearchParams(location.search).get('id') ?? '';
  const quest = useLive<Quest | null>((cb) => watchQuest(uid, id, cb), [uid, id]);
  const sessions = useLive<Session[]>((cb) => watchQuestSessions(uid, id, 20, cb), [uid, id]);

  if (quest === undefined) return <Loading />;
  if (quest === null)
    return (
      <p>
        Quest nicht gefunden. <a href="/">Zur Übersicht</a>
      </p>
    );

  const current = timer?.questId === quest.id;
  const paused = current && timer?.pausedAt !== null;

  return (
    <>
      <p>
        <a href={`/quest?id=${quest.id}`} class="back-link">
          <Icon name="chevron-left" />
          Zurück zur Quest
        </a>
      </p>
      <div class="row spread">
        <h1>{quest.name}</h1>
        {current ? (
          <div class="row">
            <button
              onClick={() => timer && (paused ? resumeQuestTimer(uid, timer) : pauseQuestTimer(uid, timer))}
            >
              {paused ? 'Fortsetzen' : 'Pause'}
            </button>
            <button class="danger" onClick={() => timer && stopRunningTimer(uid, timer)}>
              Stopp
            </button>
          </div>
        ) : (
          <button
            class="primary"
            disabled={quest.status === 'archived' || !!timer}
            title={
              quest.status === 'archived'
                ? 'Archivierte Quests lassen sich nicht starten.'
                : timer
                  ? `Erst „${timer.title || 'Timer'}“ stoppen.`
                  : undefined
            }
            onClick={() => startQuestTimer(uid, timer, quest)}
          >
            Start
          </button>
        )}
      </div>

      <QuestForm uid={uid} quest={quest} />
      <Milestones uid={uid} quest={quest} />

      <section class="panel">
        <h2>Letzte Sitzungen</h2>
        {!sessions ? (
          <Loading />
        ) : sessions.length === 0 ? (
          <p class="muted">Noch keine Sitzungen.</p>
        ) : (
          <ul class="plain sessions">
            {sessions.map((s) => (
              <li key={s.id}>
                <span>
                  {new Date(s.start).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                  {s.note && <span class="muted"> · {s.note}</span>}
                  {s.autoStopped && <span class="badge">automatisch gestoppt</span>}
                </span>
                <span>{formatDuration(workedMs(s))}</span>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href="/sitzungen" class="icon-link">
            Sitzungen bearbeiten oder nachtragen
            <Icon name="chevron-right" />
          </a>
        </p>
      </section>
    </>
  );
}

function QuestForm({ uid, quest }: { uid: string; quest: Quest }) {
  const [name, setName] = useState(quest.name);
  const [goal, setGoal] = useState(quest.goal);
  const [hours, setHours] = useState(String(quest.weeklyHours));
  const [status, setStatus] = useState<QuestStatus>(quest.status);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Änderungen von anderen Geräten übernehmen.
  useEffect(() => {
    setName(quest.name);
    setGoal(quest.goal);
    setHours(String(quest.weeklyHours));
    setStatus(quest.status);
  }, [quest.updatedAt]);

  return (
    <form
      class="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        const weeklyHours = Number(hours.replace(',', '.'));
        if (!name.trim()) return setError('Bitte gib der Quest einen Namen.');
        if (!(weeklyHours > 0)) return setError('Bitte ein Wochen-Soll über 0 Stunden angeben.');
        setError(null);
        updateQuest(uid, quest.id, { name: name.trim(), goal: goal.trim(), weeklyHours, status }).catch((err) =>
          reportError('Speichern der Quest', err),
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }}
    >
      <h2>Quest</h2>
      <label>
        Name
        <input required value={name} onInput={(e) => setName(e.currentTarget.value)} />
      </label>
      <label>
        SMART-Ziel (ohne Enddatum)
        <textarea rows={3} value={goal} onInput={(e) => setGoal(e.currentTarget.value)} />
      </label>
      <div class="row">
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
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.currentTarget.value as QuestStatus)}>
            {(Object.keys(STATUS_LABEL) as QuestStatus[]).map((s) => (
              <option value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <div class="row">
        <button type="submit">Speichern</button>
        {saved && (
          <span class="muted" role="status">
            Gespeichert
          </span>
        )}
      </div>
    </form>
  );
}

function Milestones({ uid, quest }: { uid: string; quest: Quest }) {
  const [text, setText] = useState('');
  const list = quest.milestones;

  const save = (next: Milestone[]) =>
    updateQuest(uid, quest.id, { milestones: next.map((m, i) => ({ ...m, order: i })) }).catch((e) =>
      reportError('Speichern der Meilensteine', e),
    );
  const patch = (id: string, change: (m: Milestone) => Milestone) => save(list.map((m) => (m.id === id ? change(m) : m)));

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  return (
    <section class="panel">
      <h2>Meilensteine</h2>
      {list.length === 0 && <p class="muted">Noch keine Meilensteine.</p>}
      <ul class="milestones">
        {list.map((m, i) => (
          <li key={m.id} class={m.done ? 'done' : ''}>
            <div class="milestone-row">
              <label class="check">
                <input type="checkbox" checked={m.done} onChange={() => patch(m.id, (x) => ({ ...x, done: !x.done }))} />
                <span>{m.text}</span>
              </label>
              <span class="row tight">
                <button
                  class="icon"
                  title="Nach oben"
                  aria-label={`„${m.text}“ nach oben`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <Icon name="arrow-up" />
                </button>
                <button
                  class="icon"
                  title="Nach unten"
                  aria-label={`„${m.text}“ nach unten`}
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <Icon name="arrow-down" />
                </button>
                <button
                  class="icon"
                  title="Löschen"
                  aria-label={`„${m.text}“ löschen`}
                  onClick={() => confirm(`„${m.text}“ löschen?`) && save(list.filter((x) => x.id !== m.id))}
                >
                  <Icon name="x" />
                </button>
              </span>
            </div>
            <Steps milestone={m} onChange={(steps) => patch(m.id, (x) => ({ ...x, steps }))} />
          </li>
        ))}
      </ul>
      <form
        class="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          save([...list, { id: crypto.randomUUID(), text: text.trim(), done: false, order: list.length, steps: [] }]);
          setText('');
        }}
      >
        <input
          value={text}
          onInput={(e) => setText(e.currentTarget.value)}
          placeholder="Neuer Meilenstein"
          aria-label="Neuer Meilenstein"
        />
        <button type="submit">Hinzufügen</button>
      </form>
    </section>
  );
}

/** Unterschritte eines Meilensteins: abhaken, löschen, hinzufügen. */
function Steps({ milestone, onChange }: { milestone: Milestone; onChange: (steps: Step[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const steps = milestone.steps;
  const swap = (i: number, j: number) => {
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div class="steps">
      {/* Neue Schritte bekommen die nächste Nummer und stehen damit oben. */}
      {adding ? (
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onChange([...steps, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
            setText('');
          }}
        >
          <input
            autoFocus
            value={text}
            onInput={(e) => setText(e.currentTarget.value)}
            placeholder={`Schritt ${steps.length + 1}`}
            aria-label={`Neuer Schritt zu „${milestone.text}“`}
          />
          <button type="submit">Hinzufügen</button>
          <button type="button" class="link" onClick={() => setAdding(false)}>
            Fertig
          </button>
        </form>
      ) : (
        <button class="link add-step" onClick={() => setAdding(true)}>
          + Schritt
        </button>
      )}
      {steps.length > 0 && (
        // Aufstieg zum Meilenstein: Schritt 1 ganz unten, der höchste direkt unter dem Meilenstein.
        <ol reversed class="plain step-list" aria-label={`Schritte zu „${milestone.text}“`}>
          {steps
            .map((st, i) => ({ st, i }))
            .reverse()
            .map(({ st, i }) => (
              <li key={st.id} class={st.done ? 'done' : ''}>
                <span class="step-num" aria-hidden="true">
                  {i + 1}.
                </span>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => onChange(steps.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))}
                  />
                  <span>{st.text}</span>
                </label>
                <span class="row tight">
                  {/* Optisch oben = höhere Nummer. */}
                  <button
                    class="icon"
                    title="Nach oben"
                    aria-label={`Schritt „${st.text}“ nach oben`}
                    disabled={i === steps.length - 1}
                    onClick={() => swap(i, i + 1)}
                  >
                    <Icon name="arrow-up" />
                  </button>
                  <button
                    class="icon"
                    title="Nach unten"
                    aria-label={`Schritt „${st.text}“ nach unten`}
                    disabled={i === 0}
                    onClick={() => swap(i, i - 1)}
                  >
                    <Icon name="arrow-down" />
                  </button>
                  <button
                    class="icon"
                    title="Löschen"
                    aria-label={`Schritt „${st.text}“ löschen`}
                    onClick={() => onChange(steps.filter((x) => x.id !== st.id))}
                  >
                    <Icon name="x" />
                  </button>
                </span>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}
