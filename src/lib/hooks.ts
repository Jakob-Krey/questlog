import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'preact/hooks';
import { auth } from './firebase';
import { autoStopIfNeeded, watchActiveTimer } from './db';
import type { ActiveTimer } from './types';

/** undefined = lädt noch, null = abgemeldet. */
export function useAuth(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

/** Abonniert eine Firestore-Quelle; `deps` steuern das Neu-Abonnieren. */
export function useLive<T>(subscribe: (cb: (v: T) => void) => Unsubscribe, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    setValue(undefined);
    return subscribe(setValue);
  }, deps);
  return value;
}

/** Aktueller Zeitstempel, der sich im angegebenen Intervall aktualisiert. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Laufender Timer, live über alle Geräte. Kappt vergessene Timer (> 8 h) automatisch. */
export function useActiveTimer(uid: string): ActiveTimer | null | undefined {
  const timer = useLive<ActiveTimer | null>((cb) => watchActiveTimer(uid, cb), [uid]);
  useEffect(() => {
    if (!timer) return;
    const check = () => void autoStopIfNeeded(uid, timer).catch(console.error);
    check();
    // Auch bei dauerhaft geöffneter App: regelmäßig prüfen.
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [uid, timer?.startedAt]);
  return timer;
}
