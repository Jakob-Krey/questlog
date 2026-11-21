import { overlapMs } from './time';

/** Schlüssel für Zeiten freier Timer in der Auswertung. */
export const FREE_KEY = '__free__';

export interface TimedEntry {
  questId: string | null;
  start: number;
  end: number;
}

/**
 * Summiert die Zeit pro Quest innerhalb von [from, to).
 * Sitzungen, die über die Grenzen hinausragen, zählen nur anteilig.
 */
export function totalsByQuest(entries: TimedEntry[], from: number, to: number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const ms = overlapMs(e.start, e.end, from, to);
    if (ms <= 0) continue;
    const key = e.questId ?? FREE_KEY;
    totals.set(key, (totals.get(key) ?? 0) + ms);
  }
  return totals;
}

/** Fortschritt 0…1 (gedeckelt) für Ist-Zeit gegen Wochenstunden-Soll. */
export function weeklyProgress(actualMs: number, weeklyHours: number): number {
  if (!weeklyHours || weeklyHours <= 0) return 0;
  return Math.min(1, actualMs / (weeklyHours * 3_600_000));
}

/** Ist gegen Soll, nicht gedeckelt (1.25 = 125 %). null, wenn kein Soll gesetzt ist. */
export function weeklyRatio(actualMs: number, weeklyHours: number): number | null {
  if (!weeklyHours || weeklyHours <= 0) return null;
  return actualMs / (weeklyHours * 3_600_000);
}

export type Pace = 'done' | 'on-track' | 'behind';

/**
 * Stand gegen den gleichmäßigen Wochenplan: Nach der Hälfte der Woche
 * sollte die Hälfte des Solls erreicht sein. null ohne Soll.
 */
export function paceStatus(actualMs: number, weeklyHours: number, elapsedFraction: number): Pace | null {
  const ratio = weeklyRatio(actualMs, weeklyHours);
  if (ratio === null) return null;
  if (ratio >= 1) return 'done';
  return ratio >= Math.min(1, Math.max(0, elapsedFraction)) ? 'on-track' : 'behind';
}

/** Rückstand in ms gegenüber dem gleichmäßigen Wochenplan (0, wenn im Plan). */
export function behindMs(actualMs: number, weeklyHours: number, elapsedFraction: number): number {
  const expected = weeklyHours * 3_600_000 * Math.min(1, Math.max(0, elapsedFraction));
  return Math.max(0, expected - actualMs);
}
