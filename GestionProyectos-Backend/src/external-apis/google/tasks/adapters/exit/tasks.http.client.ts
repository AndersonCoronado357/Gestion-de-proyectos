import { google, tasks_v1 } from 'googleapis';
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  CreateTaskInput,
  CreateTaskListInput,
  RenameTaskListInput,
  TaskItem,
  TaskListSummary,
  UpdateTaskInput
} from '../../domain/tasks.types';
import type { TasksPort } from '../../ports/tasks.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function toList(t: tasks_v1.Schema$TaskList): TaskListSummary {
  return {
    id: t.id ?? '',
    title: t.title ?? '(sin título)',
    updatedAt: t.updated ?? null
  };
}

function toTask(taskListId: string, t: tasks_v1.Schema$Task): TaskItem {
  return {
    id: t.id ?? '',
    taskListId,
    title: t.title ?? '',
    notes: t.notes ?? null,
    status: (t.status ?? 'needsAction') as TaskItem['status'],
    due: t.due ?? null,
    completedAt: t.completed ?? null,
    parentId: t.parent ?? null,
    position: t.position ?? null,
    webViewLink: t.webViewLink ?? null
  };
}

async function withTasks<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (c: tasks_v1.Tasks) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const tasks = google.tasks({ version: 'v1', auth });
  try {
    return await fn(tasks);
  } catch (e) {
    throw AppError.badGateway(extractGoogleError(e));
  }
}

function extractGoogleError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { errors?: Array<{ message?: string }>; message?: string };
    if (err.errors?.[0]?.message) return `Google: ${err.errors[0].message}`;
    if (err.message) return `Google: ${err.message}`;
  }
  return 'Google: error desconocido';
}

export function buildTasksHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): TasksPort {
  const resolve = deps.resolveAccessToken;

  return {
    async listTaskLists(userId) {
      return withTasks(resolve, userId, async (tasks) => {
        const r = await tasks.tasklists.list({ maxResults: 100 });
        return (r.data.items ?? []).map(toList);
      });
    },

    async createTaskList(userId, input: CreateTaskListInput) {
      return withTasks(resolve, userId, async (tasks) => {
        const r = await tasks.tasklists.insert({
          requestBody: { title: input.title }
        });
        return toList(r.data);
      });
    },

    async renameTaskList(userId, input: RenameTaskListInput) {
      return withTasks(resolve, userId, async (tasks) => {
        const r = await tasks.tasklists.patch({
          tasklist: input.taskListId,
          requestBody: { title: input.title }
        });
        return toList(r.data);
      });
    },

    async deleteTaskList(userId, taskListId) {
      await withTasks(resolve, userId, async (tasks) => {
        await tasks.tasklists.delete({ tasklist: taskListId });
      });
    },

    async listTasks(userId, taskListId) {
      return withTasks(resolve, userId, async (tasks) => {
        const r = await tasks.tasks.list({
          tasklist: taskListId,
          showCompleted: true,
          showHidden: false,
          maxResults: 100
        });
        return (r.data.items ?? []).map((t) => toTask(taskListId, t));
      });
    },

    async createTask(userId, input: CreateTaskInput) {
      return withTasks(resolve, userId, async (tasks) => {
        const r = await tasks.tasks.insert({
          tasklist: input.taskListId,
          parent: input.parentId,
          requestBody: {
            title: input.title,
            notes: input.notes,
            due: input.due
          }
        });
        return toTask(input.taskListId, r.data);
      });
    },

    async updateTask(userId, input: UpdateTaskInput) {
      return withTasks(resolve, userId, async (tasks) => {
        // Tasks API distingue completed (status='completed') de uncompleted
        // (status='needsAction'). El campo `completed` (timestamp) lo
        // setea el servidor.
        const body: tasks_v1.Schema$Task = {};
        if (input.title !== undefined) body.title = input.title;
        if (input.notes !== undefined) body.notes = input.notes;
        if (input.due !== undefined) body.due = input.due ?? undefined;
        if (input.status !== undefined) body.status = input.status;
        const r = await tasks.tasks.patch({
          tasklist: input.taskListId,
          task: input.taskId,
          requestBody: body
        });
        return toTask(input.taskListId, r.data);
      });
    },

    async deleteTask(userId, taskListId, taskId) {
      await withTasks(resolve, userId, async (tasks) => {
        await tasks.tasks.delete({ tasklist: taskListId, task: taskId });
      });
    }
  };
}
