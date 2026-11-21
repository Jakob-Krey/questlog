import { restoreTimer, startTimer, stopTimer } from './db';
import { dismissActions, notify, reportError } from './notify';
import { formatDuration } from './time';
import type { ActiveTimer, Quest } from './types';

function savedNotice(uid: string, prev: ActiveTimer, suffix = '') {
  notify({
    kind: 'info',
    text: `„${prev.title || 'Timer'}“ gespeichert (${formatDuration(Date.now() - prev.startedAt)}).${suffix}`,
    action: {
      label: 'Rückgängig',
      run: () => {
        dismissActions();
        restoreTimer(uid, prev).catch((e) => reportError('Rückgängigmachen', e));
      },
    },
  });
}

/** Startet den Timer einer Quest. Ein laufender Timer wird gespeichert – mit Rückgängig. */
export function startQuestTimer(uid: string, current: ActiveTimer | null, quest: Quest) {
  if (current?.questId === quest.id) return;
  // Nicht auf den Server warten: Offline wird der Batch nachgereicht.
  startTimer(uid, current, { questId: quest.id, title: quest.name }).catch((e) => reportError('Starten', e));
  dismissActions();
  if (current) savedNotice(uid, current, ` Jetzt läuft „${quest.name}“.`);
}

export function stopRunningTimer(uid: string, current: ActiveTimer, note?: string) {
  stopTimer(uid, current, note).catch((e) => reportError('Stoppen', e));
  dismissActions();
  savedNotice(uid, current);
}
