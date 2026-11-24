/**
 * Google-Kalender-Sync im Client (kein Server, Spark-Plan).
 * Token kommt von Google Identity Services und liegt nur im Speicher.
 */
import { deleteDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, collection, type Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'preact/hooks';
import { CALENDAR_NAME, CALENDAR_TZ, eventBody } from './calendarEvent';
import { calendarDeletesCol, toSession, userDoc } from './db';
import { auth, db } from './firebase';
import { notify } from './notify';

const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
const API = 'https://www.googleapis.com/calendar/v3';

/* ---------- Einstellungen (live, synchron abfragbar für Klick-Handler) ---------- */

export interface CalendarSettings {
  enabled: boolean;
  calendarId: string | null;
}

let settings: { uid: string; value: CalendarSettings } | null = null;
const subscribers = new Set<() => void>();
const readyWaiters = new Map<string, Array<() => void>>();

export function watchCalendarSettings(uid: string): Unsubscribe {
  return onSnapshot(
    userDoc(uid),
    (snap) => {
      const c = (snap.data()?.calendarSync ?? {}) as { enabled?: unknown; calendarId?: unknown };
      settings = {
        uid,
        value: { enabled: c.enabled === true, calendarId: typeof c.calendarId === 'string' ? c.calendarId : null },
      };
      if (settings.value.enabled) void loadGis().catch(() => {});
      subscribers.forEach((cb) => cb());
      readyWaiters.get(uid)?.forEach((r) => r());
      readyWaiters.delete(uid);
    },
    (e) => console.error('Kalender-Einstellungen', e),
  );
}

export const calendarEnabled = (uid: string) => settings?.uid === uid && settings.value.enabled;

/** Wartet, bis die Einstellungen geladen sind (z. B. vor der automatischen 8-h-Kappung). */
export function calendarSettingsReady(uid: string): Promise<void> {
  if (settings?.uid === uid) return Promise.resolve();
  return new Promise((resolve) => readyWaiters.set(uid, [...(readyWaiters.get(uid) ?? []), resolve]));
}

export function useCalendarSettings(uid: string): CalendarSettings | undefined {
  const get = () => (settings?.uid === uid ? settings.value : undefined);
  const [value, setValue] = useState(get);
  useEffect(() => {
    const cb = () => setValue(get());
    subscribers.add(cb);
    cb();
    return () => void subscribers.delete(cb);
  }, [uid]);
  return value;
}

async function saveSettings(uid: string, patch: Partial<CalendarSettings>) {
  if (settings?.uid === uid) settings = { uid, value: { ...settings.value, ...patch } };
  await setDoc(userDoc(uid), { calendarSync: patch }, { merge: true });
}

/* ---------- Token (Google Identity Services) ---------- */

export class CalendarError extends Error {}

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}
interface TokenClient {
  requestAccessToken(o?: { prompt?: string; login_hint?: string }): void;
}
interface Oauth2 {
  initTokenClient(c: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type?: string }) => void;
  }): TokenClient;
  hasGrantedAllScopes(r: TokenResponse, ...scopes: string[]): boolean;
}
const oauth2 = () => (window as { google?: { accounts?: { oauth2?: Oauth2 } } }).google?.accounts?.oauth2;

let gis: Promise<void> | null = null;

/** Lädt die GIS-Bibliothek vorab – im Klick selbst muss das Popup sofort aufgehen. */
export function loadGis(): Promise<void> {
  if (oauth2()) return Promise.resolve();
  gis ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gis = null;
      reject(new CalendarError('Google-Anmeldung konnte nicht geladen werden.'));
    };
    document.head.appendChild(s);
  });
  return gis;
}

let token: { value: string; expiresAt: number } | null = null;
let client: TokenClient | null = null;
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;

const TOKEN_ERRORS: Record<string, string> = {
  popup_closed: 'Google-Fenster wurde geschlossen.',
  popup_failed_to_open: 'Google-Fenster wurde vom Browser blockiert.',
  access_denied: 'Zugriff auf den Kalender wurde nicht erlaubt.',
};

/**
 * Holt ein Access-Token. MUSS synchron im Klick-Handler aufgerufen werden (vor jedem await),
 * sonst blockiert der Browser das Popup. Gültige Tokens werden wiederverwendet.
 */
export function requestCalendarToken(): Promise<string> {
  if (token && token.expiresAt - 60_000 > Date.now()) return Promise.resolve(token.value);
  const o = oauth2();
  const clientId = import.meta.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) return Promise.reject(new CalendarError('OAuth-Client-ID fehlt in der Konfiguration.'));
  if (!o) {
    void loadGis().catch(() => {});
    return Promise.reject(new CalendarError('Google-Anmeldung lädt noch.'));
  }
  client ??= o.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (r) => {
      const p = pending;
      pending = null;
      if (r.error || !r.access_token || !o.hasGrantedAllScopes(r, SCOPE)) {
        p?.reject(new CalendarError(TOKEN_ERRORS[r.error ?? 'access_denied'] ?? `Google: ${r.error}`));
        return;
      }
      token = { value: r.access_token, expiresAt: Date.now() + Number(r.expires_in ?? 3600) * 1000 };
      p?.resolve(token.value);
    },
    error_callback: (e) => {
      const p = pending;
      pending = null;
      p?.reject(new CalendarError(TOKEN_ERRORS[e.type ?? ''] ?? 'Google-Anmeldung fehlgeschlagen.'));
    },
  });
  pending?.reject(new CalendarError('Abgelöst durch neue Anfrage.'));
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    // prompt '' = nur beim ersten Mal fragen; login_hint überspringt die Kontoauswahl.
    client!.requestAccessToken({ prompt: '', login_hint: auth.currentUser?.email ?? undefined });
  });
}

export function forgetCalendarToken() {
  token = null;
}

/* ---------- Kalender-API ---------- */

async function api(t: string, method: string, path: string, body?: unknown): Promise<Response> {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${t}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) token = null;
  return res;
}

async function fail(res: Response, what: string): Promise<never> {
  const detail = await res.json().catch(() => null);
  console.error(what, res.status, detail);
  throw new CalendarError(
    res.status === 401 || res.status === 403
      ? 'Google hat den Zugriff abgelehnt – bitte Sync in den Einstellungen erneut einschalten.'
      : `${what} fehlgeschlagen (HTTP ${res.status}).`,
  );
}

class CalendarGone extends Error {}

async function ensureCalendar(uid: string, t: string): Promise<string> {
  const known = settings?.uid === uid ? settings.value.calendarId : null;
  if (known) return known;
  const res = await api(t, 'POST', '/calendars', { summary: CALENDAR_NAME, timeZone: CALENDAR_TZ });
  if (!res.ok) await fail(res, 'Kalender anlegen');
  const { id } = (await res.json()) as { id: string };
  await saveSettings(uid, { calendarId: id });
  return id;
}

const cal = (id: string) => `/calendars/${encodeURIComponent(id)}/events`;

async function upsertEvent(t: string, calendarId: string, eventId: string, body: object) {
  const res = await api(t, 'POST', cal(calendarId), { id: eventId, ...body });
  if (res.ok) return;
  if (res.status === 404) throw new CalendarGone();
  // 409: Termin existiert schon (oder wurde gelöscht) – dann aktualisieren bzw. wiederherstellen.
  if (res.status !== 409) await fail(res, 'Termin anlegen');
  const upd = await api(t, 'PUT', `${cal(calendarId)}/${eventId}`, body);
  if (!upd.ok) await fail(upd, 'Termin aktualisieren');
}

async function deleteEvent(t: string, calendarId: string, eventId: string) {
  const res = await api(t, 'DELETE', `${cal(calendarId)}/${eventId}`);
  // 404/410: schon weg (oder Kalender gelöscht) – Ziel erreicht.
  if (!res.ok && res.status !== 404 && res.status !== 410) await fail(res, 'Termin löschen');
}

export interface SyncResult {
  synced: number;
  failed: number;
}

let running: Promise<unknown> = Promise.resolve();

/** Überträgt alle ausstehenden Löschungen und nicht synchronisierten Sitzungen. */
export function syncCalendar(uid: string, t: string): Promise<SyncResult> {
  const run = running.catch(() => {}).then(() => syncOnce(uid, t, true));
  running = run;
  return run;
}

async function syncOnce(uid: string, t: string, retryGone: boolean): Promise<SyncResult> {
  const calendarId = await ensureCalendar(uid, t);
  const result: SyncResult = { synced: 0, failed: 0 };
  let lastError: unknown = null;
  try {
    // Erst löschen, dann anlegen: so kann eine alte Löschung keinen neuen Termin treffen.
    for (const d of (await getDocs(calendarDeletesCol(uid))).docs) {
      try {
        await deleteEvent(t, calendarId, d.id);
        await deleteDoc(d.ref);
      } catch (e) {
        result.failed++;
        lastError = e;
      }
    }
    const open = await getDocs(
      query(collection(db, 'users', uid, 'sessions'), where('calendar.synced', '==', false)),
    );
    for (const d of open.docs) {
      const s = toSession(d.id, d.data());
      if (!s.calendar) continue;
      try {
        await upsertEvent(t, calendarId, s.calendar.eventId, eventBody(s));
        await updateDoc(d.ref, { 'calendar.synced': true }).catch(() => {}); // evtl. inzwischen gelöscht
        result.synced++;
      } catch (e) {
        if (e instanceof CalendarGone) throw e;
        result.failed++;
        lastError = e;
      }
    }
  } catch (e) {
    if (e instanceof CalendarGone && retryGone) {
      // Kalender wurde in Google gelöscht: neu anlegen und noch einmal versuchen.
      await saveSettings(uid, { calendarId: null });
      return syncOnce(uid, t, false);
    }
    throw e;
  }
  if (result.failed > 0 && result.synced === 0 && lastError) throw lastError;
  return result;
}

/** Einschalten (im Klick-Handler aufrufen): Zustimmung holen, Kalender anlegen, Sync aktivieren. */
export function enableCalendarSync(uid: string): Promise<void> {
  const t = requestCalendarToken();
  return t.then(async (value) => {
    await ensureCalendar(uid, value);
    await saveSettings(uid, { enabled: true });
  });
}

export async function disableCalendarSync(uid: string): Promise<void> {
  forgetCalendarToken();
  await saveSettings(uid, { enabled: false });
}

/** Anzahl ausstehender Übertragungen (Sitzungen + Löschungen), live. */
export function watchCalendarBacklog(uid: string, cb: (n: number) => void): Unsubscribe {
  let sessions = 0;
  let deletes = 0;
  const emit = () => cb(sessions + deletes);
  const a = onSnapshot(
    query(collection(db, 'users', uid, 'sessions'), where('calendar.synced', '==', false)),
    (s) => ((sessions = s.size), emit()),
  );
  const b = onSnapshot(calendarDeletesCol(uid), (s) => ((deletes = s.size), emit()));
  return () => (a(), b());
}

/* ---------- Aufruf aus Klick-Handlern ---------- */

function reportCalendarError(e: unknown) {
  console.error('Kalender-Sync', e);
  const why = e instanceof CalendarError ? e.message : navigator.onLine ? 'Übertragung fehlgeschlagen.' : 'Offline.';
  notify({
    kind: 'error',
    text: `Kalender: ${why} Gespeichert ist alles – der Termin wird beim nächsten Stopp oder in den Einstellungen nachgeholt.`,
  });
}

/**
 * Nach einer Änderung an Sitzungen aufrufen, synchron im Klick-Handler (nach dem Firestore-Schreiben).
 * Holt bei aktivem Sync das Token und überträgt alles Offene. Fehler lassen die Sitzung unberührt.
 */
export function syncFromClick(uid: string): void {
  if (!calendarEnabled(uid)) return;
  requestCalendarToken()
    .then((t) => syncCalendar(uid, t))
    .then((r) => {
      if (r.failed > 0) reportCalendarError(new CalendarError(`${r.failed} Einträge nicht übertragen.`));
    })
    .catch(reportCalendarError);
}
