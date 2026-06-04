// Cliente HTTP del módulo de iconos.
//
// Endpoints:
//   GET    /icons             listado + búsqueda + paginación
//   POST   /icons             subir SVG (idempotente por hash)
//   PATCH  /icons/:id         renombrar
//   DELETE /icons/:id         borrar (409 si está en uso)

import { http } from '../../shared/utils/http.js';

export interface IconItem {
  id: number;
  /** Clave técnica (HomeIcon, BoxIcon...). NO se traduce. */
  name: string | null;
  /** Nombre amigable en español que se muestra en la galería. */
  displayName?: string | null;
  svg: string;
  hash: string;
  usageCount?: number;
}

export interface IconListResult {
  items: IconItem[];
  total: number;
}

interface ListFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

function toQuery(f: ListFilters): string {
  const p = new URLSearchParams();
  if (f.search) p.set('search', f.search);
  if (f.limit) p.set('limit', String(f.limit));
  if (f.offset) p.set('offset', String(f.offset));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function listIcons(filters: ListFilters = {}): Promise<IconListResult> {
  const data = await http<IconListResult>(`/icons${toQuery(filters)}`, { method: 'GET' });
  return data ?? { items: [], total: 0 };
}

export async function uploadIcon(input: {
  name?: string | null;
  displayName?: string | null;
  svg: string;
}): Promise<IconItem | null> {
  return http<IconItem>('/icons', { method: 'POST', body: input });
}

export async function renameIcon(
  id: number,
  displayName: string | null
): Promise<IconItem | null> {
  return http<IconItem>(`/icons/${id}`, {
    method: 'PATCH',
    body: { displayName }
  });
}

export async function updateIconSvg(
  id: number,
  svg: string
): Promise<IconItem | null> {
  return http<IconItem>(`/icons/${id}`, { method: 'PATCH', body: { svg } });
}

export async function deleteIcon(id: number): Promise<void> {
  await http(`/icons/${id}`, { method: 'DELETE' });
}
