// Cliente HTTP del módulo de Diseñador (constructor visual).

import { http } from '../../shared/utils/http.js';

export interface DesignProject {
  id: number;
  name: string;
  createdBy: number | null;
  primaryViewId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignView {
  id: number;
  projectId: number;
  name: string;
  position: number;
  contentDesktop: string | null;
  contentMobile: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignProjectWithViews extends DesignProject {
  views: DesignView[];
}

export async function listProjects(): Promise<DesignProject[]> {
  const res = await http<{ items: DesignProject[] }>('/design/projects', { method: 'GET' });
  return res?.items ?? [];
}

export async function getProject(id: number): Promise<DesignProjectWithViews | null> {
  return http<DesignProjectWithViews>(`/design/projects/${id}`, { method: 'GET' });
}

export async function createProject(name: string): Promise<DesignProject | null> {
  return http<DesignProject>('/design/projects', { method: 'POST', body: { name } });
}

/** Upsert por nombre: usado al entrar a "Front" desde el Hub. */
export async function findOrCreateBySubmodule(
  name: string
): Promise<DesignProject | null> {
  return http<DesignProject>('/design/by-submodule', { method: 'POST', body: { name } });
}

export async function renameProject(
  id: number,
  name: string
): Promise<DesignProject | null> {
  return http<DesignProject>(`/design/projects/${id}`, { method: 'PATCH', body: { name } });
}

export async function setPrimaryView(
  id: number,
  primaryViewId: number | null
): Promise<DesignProject | null> {
  return http<DesignProject>(`/design/projects/${id}`, {
    method: 'PATCH',
    body: { primaryViewId }
  });
}

export async function deleteProject(id: number): Promise<void> {
  await http(`/design/projects/${id}`, { method: 'DELETE' });
}

export async function createView(
  projectId: number,
  name?: string
): Promise<DesignView | null> {
  return http<DesignView>(`/design/projects/${projectId}/views`, {
    method: 'POST',
    body: name ? { name } : {}
  });
}

export interface UpdateViewPatch {
  name?: string;
  position?: number;
  contentDesktop?: string | null;
  contentMobile?: string | null;
}

export async function updateView(
  projectId: number,
  viewId: number,
  patch: UpdateViewPatch
): Promise<DesignView | null> {
  return http<DesignView>(`/design/projects/${projectId}/views/${viewId}`, {
    method: 'PATCH',
    body: patch
  });
}

export async function deleteView(projectId: number, viewId: number): Promise<void> {
  await http(`/design/projects/${projectId}/views/${viewId}`, { method: 'DELETE' });
}
