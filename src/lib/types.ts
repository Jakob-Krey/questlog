import type { Pause } from './time';

export type { Pause };

export type QuestStatus = 'active' | 'paused' | 'archived';

export interface Milestone {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface Quest {
  id: string;
  name: string;
  goal: string;
  weeklyHours: number;
  status: QuestStatus;
  milestones: Milestone[];
  todoistLabel?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  questId: string | null;
  title: string;
  start: number;
  end: number;
  note?: string;
  autoStopped: boolean;
  /** Pausen innerhalb der Sitzung; zählen nicht als Arbeitszeit. */
  pauses: Pause[];
  /** Bezug zum Termin im Google Kalender; fehlt bei Sitzungen ohne Sync. */
  calendar?: SessionCalendar;
}

export interface SessionCalendar {
  eventId: string;
  /** false = „nicht im Kalender“, wird beim nächsten Sync nachgeholt. */
  synced: boolean;
}

export interface ActiveTimer {
  questId: string | null;
  title: string;
  startedAt: number;
  /** Beginn der laufenden Pause, sonst null. */
  pausedAt: number | null;
  /** Abgeschlossene Pausen dieses Timers. */
  pauses: Pause[];
}

export interface Reflection {
  id: string;
  questId: string;
  isoWeek: string;
  text: string;
  updatedAt: number;
}

export const STATUS_LABEL: Record<QuestStatus, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  archived: 'Archiviert',
};
