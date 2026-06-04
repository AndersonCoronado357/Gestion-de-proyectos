// Tipos del dominio de iconos.

export interface IconRow {
  id: number;
  /** Clave técnica del frontend — ej. "HomeIcon". El front la usa para
   *  resolver `<HomeIcon />`. NO se traduce, queda inglés/CamelCase. */
  name: string | null;
  /** Nombre amigable en español que se muestra en la galería. */
  displayName?: string | null;
  svg: string;
  /** Hash sha256 del SVG normalizado — UNIQUE en BD para deduplicar. */
  hash: string;
  /** Cuántos modules + submodules lo están usando. Calculado, no persistido. */
  usageCount?: number;
}

export interface IconUpsertInput {
  /** Nombre técnico (clave) — opcional para iconos custom subidos por el usuario. */
  name?: string | null;
  /** Nombre a mostrar; cae al `name` si no viene. */
  displayName?: string | null;
  svg: string;
}

export interface IconListFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IconListResult {
  items: IconRow[];
  total: number;
}
