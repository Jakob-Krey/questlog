import { useState } from 'preact/hooks';
import { startTimer, stopTimer } from '../lib/db';
import { useNow } from '../lib/hooks';
import { formatClock } from '../lib/time';
import type { ActiveTimer } from '../lib/types';

interface Props {
  uid: string;
  timer: ActiveTimer | null;
}

/** Laufender Timer (live auf allen Geräten) bzw. Start eines freien Timers. */
export default function TimerBar({ uid, timer }: Props) {
  return timer ? <Running uid={uid} timer={timer} /> : <Idle uid={uid} />;
}

function Running({ uid, timer }: { uid: string; timer: ActiveTimer }) {
  const now = useNow();
  const [note, setNote] = useState('');
  const stop = () => {
    // Nicht auf den Server warten: offline wird der Batch nachgereicht.
    stopTimer(uid, timer, note).catch((e) => alert(`Stoppen fehlgeschlagen: ${e.message ?? e}`));
    setNote('');
  };
  return (
    <section class="timerbar running" aria-live="polite">
      <div class="timer-info">
        <span class="dot" aria-hidden="true" />
        <strong>{timer.title || 'Freier Timer'}</strong>
        <span class="clock">{formatClock(now - timer.startedAt)}</span>
      </div>
      <form
        class="timer-actions"
        onSubmit={(e) => {
          e.preventDefault();
          stop();
        }}
      >
        <input
          type="text"
          placeholder="Notiz (optional)"
          value={note}
          onInput={(e) => setNote(e.currentTarget.value)}
          aria-label="Notiz zur Sitzung"
        />
        <button type="submit" class="danger">
          Stopp
        </button>
      </form>
    </section>
  );
}

function Idle({ uid }: { uid: string }) {
  const [title, setTitle] = useState('');
  return (
    <section class="timerbar">
      <form
        class="timer-actions"
        onSubmit={(e) => {
          e.preventDefault();
          startTimer(uid, null, { questId: null, title: title.trim() || 'Freier Timer' }).catch((err) =>
            alert(`Start fehlgeschlagen: ${err.message ?? err}`),
          );
          setTitle('');
        }}
      >
        <span class="muted">Kein Timer läuft</span>
        <input
          type="text"
          placeholder="Freier Timer: Titel"
          value={title}
          onInput={(e) => setTitle(e.currentTarget.value)}
          aria-label="Titel für freien Timer"
        />
        <button type="submit">Start</button>
      </form>
    </section>
  );
}
