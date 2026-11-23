import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { DAY, autoStopEnd } from './time';
import type { ActiveTimer, Milestone, Quest, QuestStatus, Reflection, Session } from './types';

// Alle Daten liegen unter users/{uid}/… (siehe firestore.rules).
const questsCol = (uid: string) => collection(db, 'users', uid, 'quests');
const sessionsCol = (uid: string) => collection(db, 'users', uid, 'sessions');
const reflectionsCol = (uid: string) => collection(db, 'users', uid, 'reflections');
const activeTimerDoc = (uid: string) => doc(db, 'users', uid, 'state', 'activeTimer');

const ms = (v: unknown): number => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now());
const ts = (millis: number) => Timestamp.fromMillis(millis);

/** Sitzungs-ID eines Timers – gleich auf allen Geräten, daher keine Duplikate. */
export const timerSessionId = (startedAt: number) => `t_${startedAt}`;

function toQuest(id: string, d: DocumentData): Quest {
  return {
    id,
    name: d.name ?? '',
    goal: d.goal ?? '',
    weeklyHours: Number(d.weeklyHours ?? 0),
    status: (d.status ?? 'active') as QuestStatus,
    milestones: ((d.milestones ?? []) as Milestone[]).slice().sort((a, b) => a.order - b.order),
    todoistLabel: d.todoistLabel,
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
  };
}

function toSession(id: string, d: DocumentData): Session {
  return {
    id,
    questId: d.questId ?? null,
    title: d.title ?? '',
    start: ms(d.start),
    end: ms(d.end),
    note: d.note || undefined,
    autoStopped: !!d.autoStopped,
  };
}

/* ---------- Quests ---------- */

export function watchQuests(uid: string, cb: (quests: Quest[]) => void): Unsubscribe {
  return onSnapshot(query(questsCol(uid), orderBy('createdAt')), (snap) =>
    cb(snap.docs.map((d) => toQuest(d.id, d.data()))),
  );
}

export function watchQuest(uid: string, id: string, cb: (quest: Quest | null) => void): Unsubscribe {
  return onSnapshot(doc(questsCol(uid), id), (snap) => cb(snap.exists() ? toQuest(snap.id, snap.data()) : null));
}

/**
 * Legt eine Quest an. Die ID steht sofort fest (auch offline);
 * `saved` meldet, ob der Server den Schreibvorgang angenommen hat.
 */
export function createQuest(
  uid: string,
  data: Pick<Quest, 'name' | 'goal' | 'weeklyHours'>,
): { id: string; saved: Promise<void> } {
  const ref = doc(questsCol(uid));
  const saved = setDoc(ref, {
    ...data,
    status: 'active',
    milestones: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, saved };
}

export function updateQuest(
  uid: string,
  id: string,
  patch: Partial<Pick<Quest, 'name' | 'goal' | 'weeklyHours' | 'status' | 'milestones'>>,
): Promise<void> {
  return updateDoc(doc(questsCol(uid), id), { ...patch, updatedAt: serverTimestamp() });
}

/* ---------- Timer ---------- */

export function watchActiveTimer(uid: string, cb: (timer: ActiveTimer | null) => void): Unsubscribe {
  return onSnapshot(activeTimerDoc(uid), (snap) => {
    if (!snap.exists()) return cb(null);
    const d = snap.data();
    cb({
      questId: d.questId ?? null,
      title: d.title ?? '',
      startedAt: ms(d.startedAt),
      pausedAt: d.pausedAt ? ms(d.pausedAt) : null,
      priorMs: Number(d.priorMs ?? 0),
    });
  });
}

function timerDocData(timer: ActiveTimer) {
  return {
    questId: timer.questId,
    title: timer.title,
    startedAt: ts(timer.startedAt),
    pausedAt: timer.pausedAt === null ? null : ts(timer.pausedAt),
    priorMs: timer.priorMs,
  };
}

function sessionFromTimer(timer: ActiveTimer, end: number, note?: string, autoStopped = false) {
  return {
    questId: timer.questId,
    title: timer.title,
    start: ts(timer.startedAt),
    end: ts(Math.max(end, timer.startedAt)),
    note: note?.trim() || null,
    autoStopped,
  };
}

/**
 * Startet einen Timer. Läuft schon einer, wird er im selben Batch als Sitzung gespeichert
 * (ein pausierter ist schon gespeichert). Batch statt Transaktion, damit es auch offline funktioniert.
 */
export async function startTimer(
  uid: string,
  current: ActiveTimer | null,
  next: { questId: string | null; title: string },
): Promise<void> {
  const now = Date.now();
  const batch = writeBatch(db);
  if (current && current.pausedAt === null)
    batch.set(doc(sessionsCol(uid), timerSessionId(current.startedAt)), sessionFromTimer(current, now));
  batch.set(activeTimerDoc(uid), timerDocData({ ...next, startedAt: now, pausedAt: null, priorMs: 0 }));
  await batch.commit();
}

/**
 * Pausiert: Der Abschnitt bis jetzt wird als Sitzung gespeichert, der Timer bleibt
 * als pausiert stehen. So zählt die Pause nirgends mit.
 */
export async function pauseTimer(uid: string, current: ActiveTimer): Promise<void> {
  if (current.pausedAt !== null) return;
  const now = Math.max(Date.now(), current.startedAt);
  const batch = writeBatch(db);
  batch.set(doc(sessionsCol(uid), timerSessionId(current.startedAt)), sessionFromTimer(current, now));
  batch.set(
    activeTimerDoc(uid),
    timerDocData({ ...current, pausedAt: now, priorMs: current.priorMs + (now - current.startedAt) }),
  );
  await batch.commit();
}

/** Setzt einen pausierten Timer fort: neuer Abschnitt ab jetzt, die Gesamtzeit läuft weiter. */
export async function resumeTimer(uid: string, current: ActiveTimer): Promise<void> {
  if (current.pausedAt === null) return;
  await setDoc(activeTimerDoc(uid), timerDocData({ ...current, startedAt: Date.now(), pausedAt: null }));
}

export async function stopTimer(uid: string, current: ActiveTimer, note?: string): Promise<void> {
  const batch = writeBatch(db);
  const sessionRef = doc(sessionsCol(uid), timerSessionId(current.startedAt));
  if (current.pausedAt === null) batch.set(sessionRef, sessionFromTimer(current, Date.now(), note));
  batch.delete(activeTimerDoc(uid));
  const done = batch.commit();
  // Pausiert ist der letzte Abschnitt schon gespeichert; die Notiz kommt dorthin. Getrennt vom
  // Batch, damit der Stopp auch klappt, wenn diese Sitzung inzwischen gelöscht wurde.
  if (current.pausedAt !== null && note?.trim())
    updateDoc(sessionRef, { note: note.trim() }).catch((e) => console.warn('Notiz nicht gespeichert', e));
  await done;
}

/**
 * Macht Stopp oder Wechsel rückgängig: Der vorherige Timer läuft mit seiner ursprünglichen
 * Startzeit weiter, die gerade gespeicherte Sitzung wird gelöscht. War er pausiert, bleibt die
 * Sitzung (sie stammt von der Pause) und der Timer steht wieder pausiert da.
 */
export async function restoreTimer(uid: string, previous: ActiveTimer): Promise<void> {
  const batch = writeBatch(db);
  if (previous.pausedAt === null) batch.delete(doc(sessionsCol(uid), timerSessionId(previous.startedAt)));
  batch.set(activeTimerDoc(uid), timerDocData(previous));
  await batch.commit();
}

/** Kappt einen vergessenen Timer (> 8 h) auf Start + 8 h. Gibt true zurück, wenn gekappt wurde. */
export async function autoStopIfNeeded(uid: string, current: ActiveTimer | null): Promise<boolean> {
  // Pausiert läuft keine Zeit, es gibt nichts zu kappen.
  if (!current || current.pausedAt !== null) return false;
  const end = autoStopEnd(current.startedAt, Date.now());
  if (end === null) return false;
  const batch = writeBatch(db);
  batch.set(doc(sessionsCol(uid), timerSessionId(current.startedAt)), sessionFromTimer(current, end, undefined, true));
  batch.delete(activeTimerDoc(uid));
  await batch.commit();
  return true;
}

/* ---------- Sitzungen ---------- */

/**
 * Sitzungen, die in [from, to) liegen könnten. Etwas früher anfangen,
 * damit Sitzungen über die Zeitraumgrenze hinweg anteilig mitzählen.
 */
export function watchSessionsInRange(
  uid: string,
  from: number,
  to: number,
  cb: (sessions: Session[]) => void,
): Unsubscribe {
  const q = query(
    sessionsCol(uid),
    where('start', '>=', ts(from - DAY)),
    where('start', '<', ts(to)),
    orderBy('start', 'desc'),
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toSession(d.id, d.data()))));
}

export function watchQuestSessions(uid: string, questId: string, n: number, cb: (s: Session[]) => void): Unsubscribe {
  const q = query(sessionsCol(uid), where('questId', '==', questId), orderBy('start', 'desc'), limit(n));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toSession(d.id, d.data()))));
}

export type SessionInput = Omit<Session, 'id' | 'autoStopped'>;

export async function saveSession(uid: string, id: string | null, s: SessionInput): Promise<void> {
  if (s.end <= s.start) throw new Error('Das Ende muss nach dem Start liegen.');
  const data = {
    questId: s.questId,
    title: s.title.trim(),
    start: ts(s.start),
    end: ts(s.end),
    note: s.note?.trim() || null,
    autoStopped: false,
  };
  if (id) await setDoc(doc(sessionsCol(uid), id), data);
  else await addDoc(sessionsCol(uid), data);
}

export const deleteSession = (uid: string, id: string) => deleteDoc(doc(sessionsCol(uid), id));

/* ---------- Wochenreflexion ---------- */

export const reflectionId = (questId: string, isoWeek: string) => `${questId}_${isoWeek}`;

export function watchReflections(uid: string, isoWeek: string, cb: (r: Reflection[]) => void): Unsubscribe {
  return onSnapshot(query(reflectionsCol(uid), where('isoWeek', '==', isoWeek)), (snap) =>
    cb(
      snap.docs.map((d) => {
        const x = d.data();
        return { id: d.id, questId: x.questId, isoWeek: x.isoWeek, text: x.text ?? '', updatedAt: ms(x.updatedAt) };
      }),
    ),
  );
}

export function saveReflection(uid: string, questId: string, isoWeek: string, text: string): Promise<void> {
  return setDoc(doc(reflectionsCol(uid), reflectionId(questId, isoWeek)), {
    questId,
    isoWeek,
    text: text.trim(),
    updatedAt: serverTimestamp(),
  });
}
