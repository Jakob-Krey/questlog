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
}

export interface ActiveTimer {
  questId: string | null;
  title: string;
  startedAt: number;
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
