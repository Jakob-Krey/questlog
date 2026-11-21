import { describe, expect, it } from 'vitest';
import { behindMs, paceStatus, weeklyRatio } from '../../src/lib/stats';
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

  it('berechnet den Rückstand', () => {
    expect(behindMs(2 * HOUR, 10, 0.5)).toBe(3 * HOUR);
    expect(behindMs(8 * HOUR, 10, 0.5)).toBe(0);
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
