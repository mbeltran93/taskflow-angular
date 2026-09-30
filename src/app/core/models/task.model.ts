export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  order: number;
  assignee: string;
  createdAt: string;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt'>;

/** Metadata de cada columna del tablero, en el orden en que se dibujan. */
export const BOARD_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: 'Por hacer' },
  { status: TaskStatus.IN_PROGRESS, label: 'En progreso' },
  { status: TaskStatus.DONE, label: 'Hecho' }
];
