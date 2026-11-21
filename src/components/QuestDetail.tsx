import { useEffect, useState } from 'preact/hooks';
import { startTimer, updateQuest, watchQuest, watchQuestSessions } from '../lib/db';
import { useLive } from '../lib/hooks';
import { formatDuration } from '../lib/time';
import { STATUS_LABEL, type Milestone, type Quest, type QuestStatus, type Session } from '../lib/types';
import Shell, { type PageProps } from './Shell';

export default function QuestDetailPage() {
  return <Shell page="quest">{(p) => <QuestDetail {...p} />}</Shell>;
}

function QuestDetail({ uid, timer }: PageProps) {
  const id = new URLSearchParams(location.search).get('id') ?? '';
  const quest = useLive<Quest | null>((cb) => watchQuest(uid, id, cb), [uid, id]);
  const sessions = useLive<Session[]>((cb) => watchQuestSessions(uid, id, 20, cb), [uid, id]);

  if (quest === undefined) return <p class="muted">Lädt …</p>;
  if (quest === null)
    return (
      <p>
        Quest nicht gefunden. <a href="/">Zur Übersicht</a>
      </p>
    );

  const running = timer?.questId === quest.id;

  return (
    <>
      <p>
        <a href="/">← Übersicht</a>
      </p>
      <div class="row spread">
        <h1>{quest.name}</h1>
        <button
          class={running ? '' : 'primary'}
          disabled={running || quest.status === 'archived'}
          onClick={() => startTimer(uid, timer, { questId: quest.id, title: quest.name }).catch((e) => alert(e.message ?? e))}
        >
          {running ? 'Läuft …' : 'Start'}
        </button>
      </div>

      <QuestForm uid={uid} quest={quest} />
      <Milestones uid={uid} quest={quest} />

      <section class="panel">
        <h2>Letzte Sitzungen</h2>
        {!sessions ? (
          <p class="muted">Lädt …</p>
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
                <span>{formatDuration(s.end - s.start)}</span>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href="/sitzungen">Sitzungen bearbeiten oder nachtragen →</a>
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
        if (!name.trim()) return;
        updateQuest(uid, quest.id, {
          name: name.trim(),
          goal: goal.trim(),
          weeklyHours: Math.max(0, Number(hours) || 0),
          status,
        }).catch((err) => alert(err.message ?? err));
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
          Wochenstunden (Soll)
          <input type="number" min={0} step={0.5} value={hours} onInput={(e) => setHours(e.currentTarget.value)} />
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
      <div class="row">
        <button type="submit" class="primary">
          Speichern
        </button>
        {saved && <span class="muted">Gespeichert</span>}
      </div>
    </form>
  );
}

function Milestones({ uid, quest }: { uid: string; quest: Quest }) {
  const [text, setText] = useState('');
  const list = quest.milestones;

  const save = (next: Milestone[]) =>
    updateQuest(uid, quest.id, { milestones: next.map((m, i) => ({ ...m, order: i })) }).catch((e) =>
      alert(e.message ?? e),
    );

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
      <ol class="milestones">
        {list.map((m, i) => (
          <li key={m.id} class={m.done ? 'done' : ''}>
            <label class="check">
              <input
                type="checkbox"
                checked={m.done}
                onChange={() => save(list.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))}
              />
              <span>{m.text}</span>
            </label>
            <span class="row tight">
              <button class="icon" title="Nach oben" disabled={i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button class="icon" title="Nach unten" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button
                class="icon"
                title="Löschen"
                onClick={() => confirm(`„${m.text}“ löschen?`) && save(list.filter((x) => x.id !== m.id))}
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ol>
      <form
        class="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          save([...list, { id: crypto.randomUUID(), text: text.trim(), done: false, order: list.length }]);
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
