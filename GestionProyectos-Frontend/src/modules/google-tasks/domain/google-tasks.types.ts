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
