// Crear un icono. Normaliza el SVG y deduplica por hash:
// - Si ya existe un icono con el mismo hash, devuelve ese (idempotente),
//   actualizando su nombre si vino uno nuevo y no tenía.
// - Si no existe, lo crea.

import crypto from 'node:crypto';
import type { IconRow, IconUpsertInput } from '../domain/icon.types';
import type { IconRepositoryPort } from '../ports/icon.repository';

interface Deps {
  iconRepository: IconRepositoryPort;
}

function hashOf(svg: string): string {
  return crypto.createHash('sha256').update(svg.trim()).digest('hex');
}

function normalizeSvg(raw: string): string {
  // Quita XML prolog y comentarios; colapsa whitespace básico. NO toca el
  // contenido del <svg> (paths, viewbox), solo limpia bordes.
  return raw
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

module.exports =
  ({ iconRepository }: Deps) =>
  async (input: IconUpsertInput): Promise<IconRow> => {
    const svg = normalizeSvg(input.svg);
    if (!svg.startsWith('<svg')) {
      const err = new Error('Contenido inválido: se esperaba un SVG.');
      (err as { code?: string }).code = 'INVALID_SVG';
      throw err;
    }
    const hash = hashOf(svg);
    const existing = await iconRepository.findByHash(hash);
    if (existing) {
      // Si el SVG ya existe y el caller mandó un nombre visible y el actual
      // está vacío, aprovechamos para asignarlo.
      const wantedDisplay = input.displayName ?? input.name ?? null;
      if (wantedDisplay && !existing.displayName) {
        const renamed = await iconRepository.rename(existing.id, wantedDisplay);
        return renamed ?? existing;
      }
      return existing;
    }
    return iconRepository.create(
      {
        name: input.name ?? null,
        displayName: input.displayName ?? input.name ?? null,
        svg
      },
      hash
    );
  };
