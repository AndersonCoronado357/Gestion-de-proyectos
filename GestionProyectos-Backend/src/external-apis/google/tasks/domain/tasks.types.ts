// Tipos del dominio Google Tasks.

export interface TaskListSummary {
  id: string;
  title: string;
  updatedAt: string | null;
}

export interface TaskItem {
  id: string;
  taskListId: string;
  title: string;
  notes: string | null;
  status: 'needsAction' | 'completed' | string;
  due: string | null;
  completedAt: string | null;
  parentId: string | null;
  position: string | null;
  webViewLink: string | null;
}

// ── Inputs ───────────────────────────────────────────────────────
export interface CreateTaskListInput {
  title: string;
}

export interface RenameTaskListInput {
  taskListId: string;
  title: string;
}

export interface CreateTaskInput {
  taskListId: string;
  title: string;
  notes?: string;
  due?: string;
  parentId?: string;
}

export interface UpdateTaskInput {
  taskListId: string;
  taskId: string;
  title?: string;
  notes?: string;
  due?: string | null;
  status?: 'needsAction' | 'completed';
}
