// Reemplaza el SVG de un icono existente. Para el "editor en vivo" de la
// galería: el usuario modifica el SVG y vemos el cambio sin crear duplicado.
// Recalcula el hash. Si el nuevo hash coincide con OTRO icono distinto,
// rechazamos (sería un duplicado por contenido).

import crypto from 'node:crypto';
import type { IconRow } from '../domain/icon.types';
import type { IconRepositoryPort } from '../ports/icon.repository';

interface Deps {
  iconRepository: IconRepositoryPort;
}

function hashOf(svg: string): string {
  return crypto.createHash('sha256').update(svg.trim()).digest('hex');
}

module.exports =
  ({ iconRepository }: Deps) =>
  async ({ id, svg }: { id: number; svg: string }): Promise<IconRow | null> => {
    const trimmed = svg.trim();
    if (!trimmed.startsWith('<svg')) {
      const err = new Error('Contenido inválido: se esperaba un SVG.');
      (err as { code?: string }).code = 'INVALID_SVG';
      throw err;
    }
    const hash = hashOf(trimmed);
    const existing = await iconRepository.findByHash(hash);
    if (existing && existing.id !== id) {
      const err = new Error('Ya existe otro icono con ese mismo contenido.');
      (err as { code?: string }).code = 'DUPLICATE';
      throw err;
    }
    return iconRepository.updateSvg(id, trimmed, hash);
  };
