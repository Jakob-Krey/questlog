import { useEffect, useState } from 'preact/hooks';

export interface Notice {
  id: number;
  kind: 'info' | 'error';
  text: string;
  action?: { label: string; run: () => void };
}

let notices: Notice[] = [];
let seq = 0;
const subscribers = new Set<(n: Notice[]) => void>();
const emit = () => subscribers.forEach((cb) => cb(notices));

/** Zeigt eine kurze Meldung unten auf dem Bildschirm (statt alert()). */
export function notify(n: Omit<Notice, 'id'>, ttlMs = n.kind === 'error' ? 10_000 : 8_000): number {
  const id = ++seq;
  notices = [...notices, { ...n, id }];
  emit();
  setTimeout(() => dismiss(id), ttlMs);
  return id;
}

export function dismiss(id: number) {
  if (!notices.some((n) => n.id === id)) return;
  notices = notices.filter((n) => n.id !== id);
  emit();
}

/** Entfernt alle Meldungen mit Aktion (z. B. veraltetes „Rückgängig“). */
export function dismissActions() {
  notices = notices.filter((n) => !n.action);
  emit();
}

export function useNotices(): Notice[] {
  const [list, setList] = useState(notices);
  useEffect(() => {
    subscribers.add(setList);
    setList(notices);
    return () => void subscribers.delete(setList);
  }, []);
  return list;
}

/** Fehler verständlich melden: was schiefging und was jetzt hilft. */
export function reportError(action: string, e: unknown) {
  console.error(action, e);
  const code = (e as { code?: string } | null)?.code ?? '';
  const hint = code.includes('permission-denied')
    ? 'Keine Berechtigung – bitte ab- und wieder anmelden.'
    : code.includes('unavailable') || code.includes('network')
      ? 'Keine Verbindung – bitte später erneut versuchen.'
      : 'Bitte erneut versuchen.';
  notify({ kind: 'error', text: `${action} hat nicht geklappt. ${hint}` });
}
