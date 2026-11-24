import { pauseTimer, restoreTimer, resumeTimer, startTimer, stopTimer } from './db';
import { calendarEnabled, syncFromClick } from './gcal';
import { dismissActions, notify, reportError } from './notify';
import { timerElapsed } from './stats';
import { formatDuration } from './time';
import type { ActiveTimer, Quest } from './types';

function savedNotice(uid: string, prev: ActiveTimer, suffix = '') {
  notify({
    kind: 'info',
    text: `„${prev.title || 'Timer'}“ gespeichert (${formatDuration(timerElapsed(prev, Date.now()))}).${suffix}`,
    action: {
      label: 'Rückgängig',
      run: () => {
        dismissActions();
        restoreTimer(uid, prev, calendarEnabled(uid)).catch((e) => reportError('Rückgängigmachen', e));
        syncFromClick(uid);
      },
    },
  });
}

/**
 * Startet den Timer einer Quest. Ein laufender Timer wird gespeichert – mit Rückgängig.
 * Ist dieselbe Quest pausiert, geht es dort weiter.
 */
export function startQuestTimer(uid: string, current: ActiveTimer | null, quest: Quest) {
  if (current?.questId === quest.id) {
    if (current.pausedAt !== null) resumeQuestTimer(uid, current);
    return;
  }
  // Nicht auf den Server warten: Offline wird der Batch nachgereicht.
  startTimer(uid, current, { questId: quest.id, title: quest.name }, calendarEnabled(uid)).catch((e) =>
    reportError('Starten', e),
  );
  // Nur ein Wechsel erzeugt eine Sitzung (und damit einen Termin).
  if (current) syncFromClick(uid);
  dismissActions();
  if (current) savedNotice(uid, current, ` Jetzt läuft „${quest.name}“.`);
}

export function pauseQuestTimer(uid: string, current: ActiveTimer) {
  pauseTimer(uid, current).catch((e) => reportError('Pausieren', e));
  dismissActions();
}

export function resumeQuestTimer(uid: string, current: ActiveTimer) {
  resumeTimer(uid, current).catch((e) => reportError('Fortsetzen', e));
  dismissActions();
}

export function stopRunningTimer(uid: string, current: ActiveTimer, note?: string) {
  stopTimer(uid, current, note, calendarEnabled(uid)).catch((e) => reportError('Stoppen', e));
  // Direkt im Klick: Token anfordern (kein blockiertes Popup) und alles Offene übertragen.
  syncFromClick(uid);
  dismissActions();
  savedNotice(uid, current);
}
