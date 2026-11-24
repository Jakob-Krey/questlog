import { describe, expect, it } from 'vitest';
import { eventBody, isValidEventId, randomEventId, timerEventId } from '../../src/lib/calendarEvent';

describe('Event-IDs', () => {
  it('Timer-Sitzungen haben eine feste, gültige ID', () => {
    expect(timerEventId(1732442400000)).toBe('qlt1732442400000');
    expect(isValidEventId(timerEventId(1732442400000))).toBe(true);
  });

  it('zufällige IDs sind gültig und verschieden', () => {
    const a = randomEventId();
    expect(isValidEventId(a)).toBe(true);
    expect(a).not.toBe(randomEventId());
  });
});

describe('eventBody', () => {
  const start = Date.UTC(2026, 10, 24, 8, 0);
  const end = Date.UTC(2026, 10, 24, 10, 0);

  it('Titel, ganze Zeitspanne und Zeitzone', () => {
    const b = eventBody({ title: 'Studium', start, end });
    expect(b.summary).toBe('Questlog – Studium');
    expect(b.start).toEqual({ dateTime: '2026-11-24T08:00:00.000Z', timeZone: 'Europe/Berlin' });
    expect(b.end.dateTime).toBe('2026-11-24T10:00:00.000Z');
    expect(b.description).toBe('');
  });

  it('Pausen und Notiz stehen in der Beschreibung', () => {
    const b = eventBody({
      title: 'Studium',
      start,
      end,
      note: 'Kapitel 3',
      pauses: [{ start: start + 30 * 60_000, end: start + 45 * 60_000 }],
    });
    expect(b.description.split('\n')[0]).toBe('Kapitel 3');
    expect(b.description).toContain('Arbeitszeit');
    expect(b.description).toContain('Pause');
  });
});
