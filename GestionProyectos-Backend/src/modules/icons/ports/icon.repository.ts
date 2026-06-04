// Puerto: contrato del repositorio de iconos.

import type {
  IconListFilters,
  IconListResult,
  IconRow,
  IconUpsertInput
} from '../domain/icon.types';

export interface IconRepositoryPort {
  list(filters: IconListFilters): Promise<IconListResult>;
  findById(id: number): Promise<IconRow | null>;
  findByHash(hash: string): Promise<IconRow | null>;
  create(input: IconUpsertInput, hash: string): Promise<IconRow>;
  /** Renombra el `display_name` (NO la clave técnica `name`). */
  rename(id: number, displayName: string | null): Promise<IconRow | null>;
  /** Reemplaza el SVG de un icono existente y actualiza su hash. */
  updateSvg(id: number, svg: string, hash: string): Promise<IconRow | null>;
  delete(id: number): Promise<{ deleted: boolean; usageCount: number }>;
}

class IconRepository {}
module.exports = IconRepository;
module.exports.default = IconRepository;
