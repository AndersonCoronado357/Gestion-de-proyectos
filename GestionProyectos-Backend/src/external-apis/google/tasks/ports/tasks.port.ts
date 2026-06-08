import type {
  CreateTaskInput,
  CreateTaskListInput,
  RenameTaskListInput,
  TaskItem,
  TaskListSummary,
  UpdateTaskInput
} from '../domain/tasks.types';

export interface TasksPort {
  listTaskLists(userId: number): Promise<TaskListSummary[]>;
  createTaskList(userId: number, input: CreateTaskListInput): Promise<TaskListSummary>;
  renameTaskList(userId: number, input: RenameTaskListInput): Promise<TaskListSummary>;
  deleteTaskList(userId: number, taskListId: string): Promise<void>;

  listTasks(userId: number, taskListId: string): Promise<TaskItem[]>;
  createTask(userId: number, input: CreateTaskInput): Promise<TaskItem>;
  updateTask(userId: number, input: UpdateTaskInput): Promise<TaskItem>;
  deleteTask(userId: number, taskListId: string, taskId: string): Promise<void>;
}
