export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Ein vergessener Timer wird nach dieser Dauer gekappt. */
export const AUTO_STOP_MS = 8 * HOUR;

export type PeriodKind = 'week' | 'month' | 'quarter';

export interface Range {
  from: number;
  to: number;
}

/** Montag 00:00 (lokale Zeit) der Woche, in der `date` liegt. */
export function startOfWeek(date: Date | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const weekday = (d.getDay() + 6) % 7; // Mo = 0 … So = 6
  d.setDate(d.getDate() - weekday);
  return d;
}

/** ISO-Kalenderwoche als "YYYY-Www", z. B. "2026-W47". */
export function isoWeek(date: Date | number): string {
  const d = new Date(date);
  // Donnerstag derselben Woche bestimmt das ISO-Jahr.
  const thursday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const isoYear = thursday.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / DAY - 3 + ((firstThursday.getDay() + 6) % 7)) / 7,
    );
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Zeitraum (lokale Zeit), in dem `ref` liegt. `to` ist exklusiv. */
export function periodRange(kind: PeriodKind, ref: Date | number): Range {
  const d = new Date(ref);
  if (kind === 'week') {
    const from = startOfWeek(d);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from: from.getTime(), to: to.getTime() };
  }
  const months = kind === 'month' ? 1 : 3;
  const firstMonth = kind === 'month' ? d.getMonth() : Math.floor(d.getMonth() / 3) * 3;
  const from = new Date(d.getFullYear(), firstMonth, 1);
  const to = new Date(d.getFullYear(), firstMonth + months, 1);
  return { from: from.getTime(), to: to.getTime() };
}

/** Referenzdatum um `delta` Zeiträume verschieben. */
export function shiftPeriod(kind: PeriodKind, ref: Date | number, delta: number): Date {
  const d = new Date(periodRange(kind, ref).from);
  if (kind === 'week') d.setDate(d.getDate() + 7 * delta);
  else d.setMonth(d.getMonth() + (kind === 'month' ? 1 : 3) * delta);
  return d;
}

export function periodLabel(kind: PeriodKind, ref: Date | number): string {
  const { from, to } = periodRange(kind, ref);
  const f = new Date(from);
  if (kind === 'week') {
    const last = new Date(to - DAY);
    const fmt = (x: Date) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    return `KW ${isoWeek(f).slice(6)} · ${fmt(f)}–${fmt(last)}.${last.getFullYear()}`;
  }
  if (kind === 'month') return f.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return `Q${Math.floor(f.getMonth() / 3) + 1} ${f.getFullYear()}`;
}

/** Überlappung von [start, end) mit [from, to) in Millisekunden. */
export function overlapMs(start: number, end: number, from: number, to: number): number {
  return Math.max(0, Math.min(end, to) - Math.max(start, from));
}

/** Endzeit, auf die ein vergessener Timer gekappt wird, oder null, wenn er weiterlaufen darf. */
export function autoStopEnd(startedAt: number, now: number): number | null {
  return now - startedAt > AUTO_STOP_MS ? startedAt + AUTO_STOP_MS : null;
}

/** "1:05:09" für den laufenden Timer. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** "3:25 h" für Dauern. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / MINUTE));
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')} h`;
}

/** Wert für <input type="datetime-local"> in lokaler Zeit. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}
