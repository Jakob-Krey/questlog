import { useState } from 'preact/hooks';
import { useNow } from '../lib/hooks';
import { timerElapsed } from '../lib/stats';
import { pauseQuestTimer, resumeQuestTimer, stopRunningTimer } from '../lib/timerActions';
import { formatClock } from '../lib/time';
import type { ActiveTimer } from '../lib/types';

interface Props {
  uid: string;
  timer: ActiveTimer;
}

/** Laufender oder pausierter Timer, live auf allen Geräten. Ohne Timer wird die Leiste nicht angezeigt. */
export default function TimerBar({ uid, timer }: Props) {
  const now = useNow();
  const [note, setNote] = useState('');
  const title = timer.title || 'Timer';
  const paused = timer.pausedAt !== null;
  return (
    <section class={`timerbar ${paused ? 'paused' : 'running'}`} aria-label={paused ? 'Pausierter Timer' : 'Laufender Timer'}>
      <div class="timerbar-inner">
        <div class="timer-info">
          <span class={`dot${paused ? ' is-paused' : ''}`} aria-hidden="true" />
          <strong class="timer-title">{title}</strong>
          <span class="clock" role="timer" aria-label={paused ? 'Bisherige Zeit, pausiert' : 'Laufzeit'}>
            {formatClock(timerElapsed(timer, now))}
          </span>
          {paused && <span class="paused-label">pausiert</span>}
          {/* Nur Start, Wechsel und Pause ansagen, nicht jede Sekunde der Uhr. */}
          <span class="sr-only" aria-live="polite">
            {paused ? 'Timer pausiert' : 'Timer läuft'}: {title}
          </span>
        </div>
        <form
          class="timer-actions"
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
          <button
            type="button"
            onClick={() => (paused ? resumeQuestTimer(uid, timer) : pauseQuestTimer(uid, timer))}
          >
            {paused ? 'Fortsetzen' : 'Pause'}
          </button>
          <button type="submit" class="danger">
            Stopp
          </button>
        </form>
      </div>
    </section>
  );
}
