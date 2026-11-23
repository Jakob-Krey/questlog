import { describe, expect, it } from 'vitest';
import {
  AUTO_STOP_MS,
  HOUR,
  autoStopEnd,
  formatClock,
  formatDuration,
  fromLocalInput,
  isoWeek,
  periodRange,
  shiftPeriod,
  startOfWeek,
  toLocalInput,
} from '../../src/lib/time';
import { FREE_KEY, totalsByQuest, weeklyProgress } from '../../src/lib/stats';

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe('isoWeek', () => {
  it('berechnet ISO-Wochen inkl. Jahreswechsel', () => {
    expect(isoWeek(local(2026, 11, 21))).toBe('2026-W47');
    expect(isoWeek(local(2026, 1, 1))).toBe('2026-W01'); // Donnerstag
    expect(isoWeek(local(2027, 1, 1))).toBe('2026-W53'); // Freitag gehört zur letzten Woche 2026
    expect(isoWeek(local(2024, 12, 30))).toBe('2025-W01'); // Montag gehört schon zu 2025
  });
});

describe('Zeiträume', () => {
  it('Woche beginnt Montag 00:00', () => {
    expect(startOfWeek(local(2026, 11, 22, 15)).getTime()).toBe(local(2026, 11, 16));
    expect(periodRange('week', local(2026, 11, 21))).toEqual({ from: local(2026, 11, 16), to: local(2026, 11, 23) });
  });

  it('Monat und Quartal', () => {
    expect(periodRange('month', local(2026, 11, 21))).toEqual({ from: local(2026, 11, 1), to: local(2026, 12, 1) });
    expect(periodRange('quarter', local(2026, 11, 21))).toEqual({ from: local(2026, 10, 1), to: local(2027, 1, 1) });
  });

  it('verschiebt Zeiträume', () => {
    expect(shiftPeriod('week', local(2026, 11, 21), -1).getTime()).toBe(local(2026, 11, 9));
    expect(shiftPeriod('month', local(2026, 1, 31), 1).getTime()).toBe(local(2026, 2, 1));
    expect(shiftPeriod('quarter', local(2026, 11, 21), 1).getTime()).toBe(local(2027, 1, 1));
  });
});

describe('Auto-Stopp nach 8 Stunden', () => {
  const start = local(2026, 11, 21, 9);
  it('lässt kurze Timer laufen', () => {
    expect(autoStopEnd(start, start + 7 * HOUR)).toBeNull();
    expect(autoStopEnd(start, start + AUTO_STOP_MS)).toBeNull();
  });
  it('kappt vergessene Timer auf Start + 8 h', () => {
    expect(autoStopEnd(start, start + 30 * HOUR)).toBe(start + 8 * HOUR);
  });
  it('zählt Pausen beim Kappen nicht mit', () => {
    expect(autoStopEnd(start, start + 9 * HOUR, 2 * HOUR)).toBeNull();
    expect(autoStopEnd(start, start + 30 * HOUR, 2 * HOUR)).toBe(start + 10 * HOUR);
  });
});

describe('Auswertung', () => {
  it('summiert pro Quest und kappt an Zeitraumgrenzen', () => {
    const { from, to } = periodRange('week', local(2026, 11, 18));
    const totals = totalsByQuest(
      [
        { questId: 'a', start: local(2026, 11, 17, 10), end: local(2026, 11, 17, 12) },
        { questId: 'a', start: local(2026, 11, 18, 9), end: local(2026, 11, 18, 9, 30) },
        { questId: null, start: local(2026, 11, 19, 8), end: local(2026, 11, 19, 9) },
        // ragt aus der Vorwoche herein: nur 1 h zählt
        { questId: 'b', start: local(2026, 11, 15, 23), end: local(2026, 11, 16, 1) },
        // komplett außerhalb
        { questId: 'b', start: local(2026, 11, 24, 10), end: local(2026, 11, 24, 11) },
      ],
      from,
      to,
    );
    expect(totals.get('a')).toBe(2.5 * HOUR);
    expect(totals.get('b')).toBe(1 * HOUR);
    expect(totals.get(FREE_KEY)).toBe(1 * HOUR);
  });

  it('Fortschritt ist auf 100 % gedeckelt', () => {
    expect(weeklyProgress(5 * HOUR, 10)).toBe(0.5);
    expect(weeklyProgress(15 * HOUR, 10)).toBe(1);
    expect(weeklyProgress(1 * HOUR, 0)).toBe(0);
  });
});

describe('Formatierung', () => {
  it('formatiert Dauern', () => {
    expect(formatClock(HOUR + 5 * 60_000 + 9_000)).toBe('1:05:09');
    expect(formatDuration(3 * HOUR + 25 * 60_000)).toBe('3:25 h');
  });
  it('datetime-local hin und zurück', () => {
    const t = local(2026, 11, 21, 14, 7);
    expect(toLocalInput(t)).toBe('2026-11-21T14:07');
    expect(fromLocalInput(toLocalInput(t))).toBe(t);
    expect(fromLocalInput('')).toBeNull();
  });
});
