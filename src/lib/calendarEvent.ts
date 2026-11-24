import { formatDuration, pausedMsIn, workedMs, type Pause } from './time';

export const CALENDAR_NAME = 'Questlog';
export const CALENDAR_TZ = 'Europe/Berlin';

/** Zeichen, die Google für Event-IDs erlaubt (base32hex, Kleinbuchstaben). */
const BASE32HEX = '0123456789abcdefghijklmnopqrstuv';

/** Event-ID einer Timer-Sitzung – auf allen Geräten gleich, daher keine doppelten Termine. */
export const timerEventId = (startedAt: number) => `qlt${startedAt}`;

/** Zufällige Event-ID für manuell eingetragene Sitzungen. */
export function randomEventId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(26));
  return 'qlm' + Array.from(bytes, (b) => BASE32HEX[b % 32]).join('');
}

export const isValidEventId = (id: string) => /^[0-9a-v]{5,1024}$/.test(id);

export interface EventSource {
  title: string;
  start: number;
  end: number;
  note?: string;
  pauses?: Pause[];
}

/** Termin über die ganze Sitzung; Pausen und Notiz stehen in der Beschreibung. */
export function eventBody(s: EventSource) {
  const lines: string[] = [];
  if (s.note) lines.push(s.note);
  const paused = pausedMsIn(s.pauses, s.start, s.end);
  if (paused > 0) lines.push(`Arbeitszeit: ${formatDuration(workedMs(s))} · Pause: ${formatDuration(paused)}`);
  return {
    summary: `Questlog – ${s.title || 'Ohne Quest'}`,
    description: lines.join('\n'),
    start: { dateTime: new Date(s.start).toISOString(), timeZone: CALENDAR_TZ },
    end: { dateTime: new Date(s.end).toISOString(), timeZone: CALENDAR_TZ },
    status: 'confirmed',
  };
}
