// Cliente HTTP del page-builder: generación de archivos en disco a
// partir del template module-x, y publicación del diseño visual como
// páginas reales del submódulo generado.

import { http, HttpError } from '../../shared/utils/http.js';

export interface ScaffoldedSubmodule {
  key: string;
  name: string;
  count: number;
  files: string[];
}

/** POST /builder/submodule — clona module-x a backend/frontend con
 *  el nombre dado. Si el módulo ya existe en disco devuelve null
 *  (status 409) para que el caller pueda continuar sin abortar. */
export async function scaffoldSubmodule(
  name: string
): Promise<ScaffoldedSubmodule | null> {
  try {
    return await http<ScaffoldedSubmodule>('/builder/submodule', {
      method: 'POST',
      body: { name }
    });
  } catch (e) {
    if (e instanceof HttpError && e.status === 409) return null;
    throw e;
  }
}

export interface PublishedDesign {
  key: string;
  primaryViewId: number | null;
  files: string[];
}

/** POST /builder/publish-design — materializa cada vista del
 *  design_project en un .tsx del submódulo en disco. La vista marcada
 *  como `primaryViewId` queda como página principal del submódulo. */
export async function publishDesign(
  projectId: number
): Promise<PublishedDesign | null> {
  return http<PublishedDesign>('/builder/publish-design', {
    method: 'POST',
    body: { projectId }
  });
}
