import {
  Timestamp,
  addDoc,
  collection,
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
import { randomEventId, timerEventId } from './calendarEvent';
import { db } from './firebase';
import { DAY, autoStopEnd, clampPauses, pausedMsIn, type Pause } from './time';
import type { ActiveTimer, Milestone, Quest, QuestStatus, Reflection, Session, SessionCalendar } from './types';

// Alle Daten liegen unter users/{uid}/… (siehe firestore.rules).
const questsCol = (uid: string) => collection(db, 'users', uid, 'quests');
const sessionsCol = (uid: string) => collection(db, 'users', uid, 'sessions');
const reflectionsCol = (uid: string) => collection(db, 'users', uid, 'reflections');
const activeTimerDoc = (uid: string) => doc(db, 'users', uid, 'state', 'activeTimer');
export const userDoc = (uid: string) => doc(db, 'users', uid);
export const calendarDeletesCol = (uid: string) => collection(db, 'users', uid, 'calendarDeletes');

const ms = (v: unknown): number => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now());
const ts = (millis: number) => Timestamp.fromMillis(millis);

const toPauses = (v: unknown): Pause[] =>
  Array.isArray(v) ? v.map((p) => ({ start: ms(p?.start), end: ms(p?.end) })).filter((p) => p.end > p.start) : [];
const fromPauses = (pauses: Pause[]) => pauses.map((p) => ({ start: ts(p.start), end: ts(p.end) }));

/** Sitzungs-ID eines Timers – gleich auf allen Geräten, daher keine Duplikate. */
export const timerSessionId = (startedAt: number) => `t_${startedAt}`;

function toQuest(id: string, d: DocumentData): Quest {
  return {
    id,
    name: d.name ?? '',
    goal: d.goal ?? '',
    weeklyHours: Number(d.weeklyHours ?? 0),
    status: (d.status ?? 'active') as QuestStatus,
    milestones: ((d.milestones ?? []) as Milestone[])
      .map((m) => ({ ...m, steps: m.steps ?? [] }))
      .sort((a, b) => a.order - b.order),
    todoistLabel: d.todoistLabel,
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
  };
}

function toCalendar(v: unknown): SessionCalendar | undefined {
  const c = v as { eventId?: unknown; synced?: unknown } | null | undefined;
  return c && typeof c.eventId === 'string' ? { eventId: c.eventId, synced: !!c.synced } : undefined;
}

export function toSession(id: string, d: DocumentData): Session {
  return {
    id,
    questId: d.questId ?? null,
    title: d.title ?? '',
    start: ms(d.start),
    end: ms(d.end),
    note: d.note || undefined,
    autoStopped: !!d.autoStopped,
    pauses: toPauses(d.pauses),
    calendar: toCalendar(d.calendar),
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
      pauses: toPauses(d.pauses),
    });
  });
}

function timerDocData(timer: ActiveTimer) {
  return {
    questId: timer.questId,
    title: timer.title,
    startedAt: ts(timer.startedAt),
    pausedAt: timer.pausedAt === null ? null : ts(timer.pausedAt),
    pauses: fromPauses(timer.pauses),
  };
}

/**
 * Eine Sitzung für den ganzen Timer. Wird er während einer Pause beendet,
 * endet die Sitzung mit dem Pausenbeginn.
 */
function sessionFromTimer(timer: ActiveTimer, end: number, calendar: boolean, note?: string, autoStopped = false) {
  const stop = Math.max(timer.startedAt, Math.min(end, timer.pausedAt ?? end));
  return {
    // Bei aktivem Kalender-Sync: zunächst „nicht synchronisiert“, die Übertragung folgt danach.
    ...(calendar ? { calendar: { eventId: timerEventId(timer.startedAt), synced: false } } : {}),
    questId: timer.questId,
    title: timer.title,
    start: ts(timer.startedAt),
    end: ts(stop),
    pauses: fromPauses(clampPauses(timer.pauses, timer.startedAt, stop)),
    note: note?.trim() || null,
    autoStopped,
  };
}

type Batch = ReturnType<typeof writeBatch>;

function queueCalendarDelete(batch: Batch, uid: string, eventId: string) {
  batch.set(doc(calendarDeletesCol(uid), eventId), { createdAt: serverTimestamp() });
}

/**
 * Schreibt die Sitzung eines Timers. Eine noch ausstehende Löschung desselben Termins
 * (nach „Rückgängig“) wird verworfen, sonst würde sie den neuen Termin entfernen.
 */
function writeTimerSession(batch: Batch, uid: string, timer: ActiveTimer, data: DocumentData, calendar: boolean) {
  batch.set(doc(sessionsCol(uid), timerSessionId(timer.startedAt)), data);
  if (calendar) batch.delete(doc(calendarDeletesCol(uid), timerEventId(timer.startedAt)));
}

/**
 * Startet einen Timer. Läuft schon einer (auch pausiert), wird er im selben Batch als Sitzung
 * gespeichert. Batch statt Transaktion, damit es auch offline funktioniert.
 */
export async function startTimer(
  uid: string,
  current: ActiveTimer | null,
  next: { questId: string | null; title: string },
  calendar = false,
): Promise<void> {
  const now = Date.now();
  const batch = writeBatch(db);
  if (current) writeTimerSession(batch, uid, current, sessionFromTimer(current, now, calendar), calendar);
  batch.set(activeTimerDoc(uid), timerDocData({ ...next, startedAt: now, pausedAt: null, pauses: [] }));
  await batch.commit();
}

/** Pausiert den Timer. Die Sitzung läuft weiter, nur die Pausenzeit zählt nicht. */
export async function pauseTimer(uid: string, current: ActiveTimer): Promise<void> {
  if (current.pausedAt !== null) return;
  await setDoc(activeTimerDoc(uid), timerDocData({ ...current, pausedAt: Math.max(Date.now(), current.startedAt) }));
}

/** Setzt den pausierten Timer fort; die Pause wird in der Sitzung vermerkt. */
export async function resumeTimer(uid: string, current: ActiveTimer): Promise<void> {
  if (current.pausedAt === null) return;
  const pause = { start: current.pausedAt, end: Math.max(Date.now(), current.pausedAt) };
  await setDoc(activeTimerDoc(uid), timerDocData({ ...current, pausedAt: null, pauses: [...current.pauses, pause] }));
}

export async function stopTimer(uid: string, current: ActiveTimer, note?: string, calendar = false): Promise<void> {
  const batch = writeBatch(db);
  writeTimerSession(batch, uid, current, sessionFromTimer(current, Date.now(), calendar, note), calendar);
  batch.delete(activeTimerDoc(uid));
  await batch.commit();
}

/**
 * Macht Stopp oder Wechsel rückgängig: Die gerade gespeicherte Sitzung wird gelöscht und
 * der vorherige Timer läuft mit Startzeit und Pausen weiter (bzw. steht wieder pausiert da).
 */
export async function restoreTimer(uid: string, previous: ActiveTimer, calendar = false): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(sessionsCol(uid), timerSessionId(previous.startedAt)));
  // Ein evtl. schon angelegter Termin muss wieder weg.
  if (calendar) queueCalendarDelete(batch, uid, timerEventId(previous.startedAt));
  batch.set(activeTimerDoc(uid), timerDocData(previous));
  await batch.commit();
}

/**
 * Kappt einen vergessenen Timer nach 8 h Arbeitszeit (Pausen zählen nicht).
 * Pausiert läuft keine Zeit, dann wird nichts gekappt. Gibt true zurück, wenn gekappt wurde.
 */
export async function autoStopIfNeeded(uid: string, current: ActiveTimer | null, calendar = false): Promise<boolean> {
  if (!current || current.pausedAt !== null) return false;
  const now = Date.now();
  const end = autoStopEnd(current.startedAt, now, pausedMsIn(current.pauses, current.startedAt, now));
  if (end === null) return false;
  const batch = writeBatch(db);
  writeTimerSession(batch, uid, current, sessionFromTimer(current, end, calendar, undefined, true), calendar);
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

export type SessionInput = Omit<Session, 'id' | 'autoStopped' | 'pauses'> & { pauses?: Pause[] };

/**
 * Speichert eine Sitzung. Mit aktivem Kalender-Sync wird sie als „nicht synchronisiert“ markiert
 * (bestehende Event-ID bleibt). Ohne Sync bleibt ein vorhandener Kalender-Bezug unverändert.
 */
export async function saveSession(uid: string, id: string | null, s: SessionInput, calendar = false): Promise<void> {
  if (s.end <= s.start) throw new Error('Das Ende muss nach dem Start liegen.');
  const data = {
    questId: s.questId,
    title: s.title.trim(),
    start: ts(s.start),
    end: ts(s.end),
    // Pausen bleiben beim Bearbeiten erhalten, soweit sie noch in der Sitzung liegen.
    pauses: fromPauses(clampPauses(s.pauses, s.start, s.end)),
    note: s.note?.trim() || null,
    autoStopped: false,
    ...(calendar
      ? { calendar: { eventId: s.calendar?.eventId ?? randomEventId(), synced: false } }
      : s.calendar
        ? { calendar: s.calendar }
        : {}),
  };
  if (id) await setDoc(doc(sessionsCol(uid), id), data);
  else await addDoc(sessionsCol(uid), data);
}

/** Löscht eine Sitzung; mit aktivem Sync wird die Löschung des Termins vorgemerkt. */
export async function deleteSession(
  uid: string,
  session: Pick<Session, 'id' | 'calendar'>,
  calendar = false,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(sessionsCol(uid), session.id));
  if (calendar && session.calendar) queueCalendarDelete(batch, uid, session.calendar.eventId);
  await batch.commit();
}

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
