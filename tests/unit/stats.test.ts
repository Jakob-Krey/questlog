import { describe, expect, it } from 'vitest';
import { paceStatus, timerElapsed, totalsByQuest, weeklyRatio, withRunningTimer } from '../../src/lib/stats';
import { HOUR, daysLeftInWeek, formatHours } from '../../src/lib/time';

describe('Wochenfortschritt', () => {
  it('rechnet Ist gegen Soll ungedeckelt', () => {
    expect(weeklyRatio(5 * HOUR, 10)).toBe(0.5);
    expect(weeklyRatio(12.5 * HOUR, 10)).toBe(1.25);
    expect(weeklyRatio(1 * HOUR, 0)).toBeNull();
  });

  it('bewertet den Stand gegen den gleichmäßigen Wochenplan', () => {
    expect(paceStatus(10 * HOUR, 10, 0.3)).toBe('done');
    expect(paceStatus(6 * HOUR, 10, 0.5)).toBe('on-track');
    expect(paceStatus(2 * HOUR, 10, 0.5)).toBe('behind');
    expect(paceStatus(0, 10, 0)).toBe('on-track');
    expect(paceStatus(1 * HOUR, 0, 0.5)).toBeNull();
  });
});

describe('Formate', () => {
  it('zeigt Stunden-Soll auf Deutsch', () => {
    expect(formatHours(5)).toBe('5 h');
    expect(formatHours(2.5)).toBe('2,5 h');
  });

  it('zählt verbleibende Tage inkl. heute', () => {
    expect(daysLeftInWeek(new Date(2026, 10, 16, 12).getTime())).toBe(7); // Montag
    expect(daysLeftInWeek(new Date(2026, 10, 20, 12).getTime())).toBe(3); // Freitag
    expect(daysLeftInWeek(new Date(2026, 10, 22, 12).getTime())).toBe(1); // Sonntag
  });
});

describe('Wochenbeschriftung', () => {
  it('setzt genau einen Punkt vor dem Jahr', async () => {
    const { periodLabel } = await import('../../src/lib/time');
    expect(periodLabel('week', new Date(2026, 10, 20))).toBe('KW 47 · 16.11.–22.11.2026');
  });
});

describe('Pausierbarer Timer', () => {
  const base = { questId: 'q1', title: 'Q', startedAt: 0, pausedAt: null, pauses: [{ start: 1_000, end: 3_000 }] };

  it('zieht Pausen von der Laufzeit ab', () => {
    expect(timerElapsed(base, 10_000)).toBe(8_000);
  });

  it('bleibt pausiert stehen', () => {
    expect(timerElapsed({ ...base, pausedAt: 5_000 }, 60_000)).toBe(3_000);
  });

  it('zählt den Timer als eine Sitzung ohne Pausenzeit', () => {
    const entries = withRunningTimer([], { ...base, pausedAt: 5_000 }, 60_000);
    expect(entries).toHaveLength(1);
    expect(totalsByQuest(entries, 0, 100_000).get('q1')).toBe(3_000);
  });

  it('rechnet Pausen über Zeitraumgrenzen anteilig', () => {
    const e = [{ questId: 'q1', start: 0, end: 10_000, pauses: [{ start: 4_000, end: 8_000 }] }];
    expect(totalsByQuest(e, 0, 6_000).get('q1')).toBe(4_000);
    expect(totalsByQuest(e, 6_000, 20_000).get('q1')).toBe(2_000);
  });
});
