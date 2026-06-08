import { http } from '../../../../shared/utils/http.js';
import type {
  TaskItem,
  TaskListSummary
} from '../../domain/google-tasks.types.js';
import type {
  GoogleTasksRepository,
  UpdateTaskInput
} from '../../ports/google-tasks.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleTasksHttp: GoogleTasksRepository = {
  async listTaskLists() {
    const r = await http<{ items: TaskListSummary[] }>(
      '/external-apis/google/tasks/lists',
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async createTaskList(title) {
    return http<TaskListSummary>('/external-apis/google/tasks/lists', {
      method: 'POST',
      body: { title }
    });
  },

  async renameTaskList(id, title) {
    return http<TaskListSummary>(`/external-apis/google/tasks/lists/${enc(id)}`, {
      method: 'PATCH',
      body: { title }
    });
  },

  async deleteTaskList(id) {
    await http(`/external-apis/google/tasks/lists/${enc(id)}`, {
      method: 'DELETE'
    });
  },

  async listTasks(taskListId) {
    const r = await http<{ items: TaskItem[] }>(
      `/external-apis/google/tasks/lists/${enc(taskListId)}/tasks`,
      { method: 'GET' }
    );
    return r?.items ?? [];
  },

  async createTask(taskListId, title, extras = {}) {
    return http<TaskItem>(
      `/external-apis/google/tasks/lists/${enc(taskListId)}/tasks`,
      { method: 'POST', body: { title, ...extras } }
    );
  },

  async updateTask(taskListId, taskId, input: UpdateTaskInput) {
    return http<TaskItem>(
      `/external-apis/google/tasks/lists/${enc(taskListId)}/tasks/${enc(taskId)}`,
      { method: 'PATCH', body: input }
    );
  },

  async deleteTask(taskListId, taskId) {
    await http(
      `/external-apis/google/tasks/lists/${enc(taskListId)}/tasks/${enc(taskId)}`,
      { method: 'DELETE' }
    );
  }
};
