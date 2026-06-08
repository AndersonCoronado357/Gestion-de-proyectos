import type {
  TaskItem,
  TaskListSummary
} from '../domain/google-tasks.types.js';

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  due?: string | null;
  status?: 'needsAction' | 'completed';
}

export interface GoogleTasksRepository {
  listTaskLists(): Promise<TaskListSummary[]>;
  createTaskList(title: string): Promise<TaskListSummary | null>;
  renameTaskList(id: string, title: string): Promise<TaskListSummary | null>;
  deleteTaskList(id: string): Promise<void>;

  listTasks(taskListId: string): Promise<TaskItem[]>;
  createTask(
    taskListId: string,
    title: string,
    extras?: { notes?: string; due?: string; parentId?: string }
  ): Promise<TaskItem | null>;
  updateTask(
    taskListId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskItem | null>;
  deleteTask(taskListId: string, taskId: string): Promise<void>;
}
