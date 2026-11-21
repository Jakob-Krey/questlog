import { useState } from 'preact/hooks';
import { deleteSession, saveSession, watchQuests, watchSessionsInRange, type SessionInput } from '../lib/db';
import { useLive } from '../lib/hooks';
import { reportError } from '../lib/notify';
import { HOUR, formatDuration, fromLocalInput, overlapMs, periodRange, toLocalInput } from '../lib/time';
import type { Quest, Session } from '../lib/types';
import Loading from './Loading';
import PeriodNav from './PeriodNav';
import Shell, { type PageProps } from './Shell';

export default function SessionsPage() {
  return <Shell page="sitzungen">{(p) => <Sessions {...p} />}</Shell>;
}

function Sessions({ uid }: PageProps) {
  const [refDate, setRefDate] = useState(new Date());
  const [adding, setAdding] = useState(false);
  const week = periodRange('week', refDate);
  const quests = useLive<Quest[]>((cb) => watchQuests(uid, cb), [uid]);
  const sessions = useLive<Session[]>((cb) => watchSessionsInRange(uid, week.from, week.to, cb), [uid, week.from]);

  if (!quests || !sessions) return <Loading />;
  const inWeek = sessions.filter((s) => overlapMs(s.start, s.end, week.from, week.to) > 0);
  const questName = (id: string | null) => (id ? quests.find((q) => q.id === id)?.name : null);
  const firstActive = quests.find((q) => q.status === 'active') ?? quests.find((q) => q.status !== 'archived');

  return (
    <>
      <h1>Sitzungen</h1>
      <PeriodNav kind="week" refDate={refDate} onChange={setRefDate} />

      {!firstActive ? (
        <p class="muted">
          Sitzungen gehören immer zu einer Quest. <a href="/">Leg zuerst eine Quest an.</a>
        </p>
      ) : adding ? (
        <SessionForm
          uid={uid}
          quests={quests}
          initial={{ questId: firstActive.id, title: firstActive.name, start: Date.now() - HOUR, end: Date.now() }}
          onDone={() => setAdding(false)}
        />
      ) : (
        <p>
          <button onClick={() => setAdding(true)}>+ Sitzung nachtragen</button>
        </p>
      )}

      {inWeek.length === 0 ? (
        <p class="muted">Keine Sitzungen in dieser Woche.</p>
      ) : (
        <ul class="plain sessions">
          {inWeek.map((s) => (
            <SessionRow key={s.id} uid={uid} session={s} quests={quests} label={questName(s.questId) ?? s.title} />
          ))}
        </ul>
      )}
    </>
  );
}

function SessionRow({ uid, session, quests, label }: { uid: string; session: Session; quests: Quest[]; label: string }) {
  const [editing, setEditing] = useState(false);
  if (editing)
    return (
      <li class="editing">
        <SessionForm uid={uid} id={session.id} quests={quests} initial={session} onDone={() => setEditing(false)} />
      </li>
    );
  const fmt = (t: number) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return (
    <li>
      <span>
        <strong>{label || 'Ohne Quest'}</strong>
        {!session.questId && <span class="badge">ohne Quest</span>}
        {session.autoStopped && <span class="badge">automatisch gestoppt</span>}
        <br />
        <span class="muted">
          {new Date(session.start).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}{' '}
          {fmt(session.start)}–{fmt(session.end)}
          {session.note && ` · ${session.note}`}
        </span>
      </span>
      <span class="row tight">
        {formatDuration(session.end - session.start)}
        <button class="link" onClick={() => setEditing(true)}>
          Bearbeiten
        </button>
      </span>
    </li>
  );
}

interface FormProps {
  uid: string;
  id?: string;
  quests: Quest[];
  initial: SessionInput;
  onDone: () => void;
}

function SessionForm({ uid, id, quests, initial, onDone }: FormProps) {
  const [questId, setQuestId] = useState(initial.questId ?? '');
  const [title, setTitle] = useState(initial.title);
  const [start, setStart] = useState(toLocalInput(initial.start));
  const [end, setEnd] = useState(toLocalInput(initial.end));
  const [note, setNote] = useState(initial.note ?? '');
  const [error, setError] = useState<string | null>(null);

  // Archivierte Quests nur anbieten, wenn die Sitzung schon dazugehört.
  const options = quests.filter((q) => q.status !== 'archived' || q.id === initial.questId);
  // Freie Timer gibt es nicht mehr; ältere Sitzungen ohne Quest bleiben bearbeitbar.
  const legacyFree = !!id && initial.questId === null;

  return (
    <form
      class="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        const s = fromLocalInput(start);
        const en = fromLocalInput(end);
        if (s === null || en === null) return setError('Bitte Start und Ende angeben.');
        if (en <= s) return setError('Das Ende muss nach dem Start liegen.');
        const quest = quests.find((q) => q.id === questId);
        if (!quest && !legacyFree) return setError('Bitte eine Quest auswählen.');
        // Nicht auf den Server warten (offline-fähig); Fehler trotzdem melden.
        saveSession(uid, id ?? null, {
          questId: quest?.id ?? null,
          title: quest ? quest.name : title.trim() || 'Ohne Quest',
          start: s,
          end: en,
          note,
        }).catch((err) => reportError('Speichern der Sitzung', err));
        onDone();
      }}
    >
      <label>
        Quest
        <select required={!legacyFree} value={questId} onChange={(e) => setQuestId(e.currentTarget.value)}>
          {legacyFree && <option value="">Ohne Quest</option>}
          {options.map((q) => (
            <option value={q.id}>{q.name}</option>
          ))}
        </select>
      </label>
      {legacyFree && !questId && (
        <label>
          Titel
          <input value={title} onInput={(e) => setTitle(e.currentTarget.value)} placeholder="Ohne Quest" />
        </label>
      )}
      <div class="row">
        <label>
          Start
          <input type="datetime-local" required value={start} onInput={(e) => setStart(e.currentTarget.value)} />
        </label>
        <label>
          Ende
          <input type="datetime-local" required value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
        </label>
      </div>
      <label>
        Notiz
        <input value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <div class="row">
        <button type="submit" class="primary">
          Speichern
        </button>
        <button type="button" class="link" onClick={onDone}>
          Abbrechen
        </button>
        {id && (
          <button
            type="button"
            class="link danger-text"
            onClick={() => {
              if (!confirm('Sitzung löschen?')) return;
              deleteSession(uid, id).catch((err) => reportError('Löschen der Sitzung', err));
              onDone();
            }}
          >
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}
