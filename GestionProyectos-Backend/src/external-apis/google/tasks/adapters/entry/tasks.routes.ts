import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildTasksHttpClient } from '../exit/tasks.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./tasks.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const tasks = buildTasksHttpClient({ resolveAccessToken });
  const controller = buildController({ tasks });
  const router = Router();

  router.get('/lists', authMiddleware, controller.listTaskLists);
  router.post('/lists', authMiddleware, controller.createTaskList);
  router.patch('/lists/:id', authMiddleware, controller.renameTaskList);
  router.delete('/lists/:id', authMiddleware, controller.deleteTaskList);

  router.get('/lists/:id/tasks', authMiddleware, controller.listTasks);
  router.post('/lists/:id/tasks', authMiddleware, controller.createTask);
  router.patch('/lists/:id/tasks/:taskId', authMiddleware, controller.updateTask);
  router.delete('/lists/:id/tasks/:taskId', authMiddleware, controller.deleteTask);

  return router;
};
