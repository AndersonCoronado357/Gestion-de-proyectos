// Implementación Knex (SQL Server) del IconRepository.

import type { Knex } from 'knex';
import type {
  IconListFilters,
  IconListResult,
  IconRow,
  IconUpsertInput
} from '../../domain/icon.types';
import type { IconRepositoryPort } from '../../ports/icon.repository';

const IconRepository = require('../../ports/icon.repository');

interface DbRow {
  id: number;
  name: string | null;
  display_name?: string | null;
  svg: string;
  hash: string;
}

function toRow(r: DbRow & { usage_count?: number | string }): IconRow {
  return {
    id: r.id,
    name: r.name,
    displayName: r.display_name ?? null,
    svg: r.svg,
    hash: r.hash,
    usageCount: r.usage_count != null ? Number(r.usage_count) : undefined
  };
}

class IconRepositoryImpl extends IconRepository implements IconRepositoryPort {
  private db: Knex;
  private table = 'icons';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  // Joinea con submodules.icon_id y modules.icon_id si existen para devolver
  // `usage_count` (suma de los dos).
  private async usageSources(): Promise<string[]> {
    const out: string[] = [];
    if (await this.db.schema.hasColumn('submodules', 'icon_id')) out.push('submodules');
    if (await this.db.schema.hasColumn('modules', 'icon_id')) out.push('modules');
    return out;
  }

  async list(filters: IconListFilters): Promise<IconListResult> {
    const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);
    const offset = Math.max(filters.offset ?? 0, 0);
    const sources = await this.usageSources();
    // Subquery que suma todos los conteos (modules + submodules) por icono.
    const usageSelect =
      sources.length === 0
        ? this.db.raw('0 AS usage_count')
        : this.db.raw(
            `(${sources
              .map(
                (t) =>
                  `(SELECT COUNT(*) FROM ${t} WHERE ${t}.icon_id = ${this.table}.id)`
              )
              .join(' + ')}) AS usage_count`
          );

    let q = this.db<DbRow>(this.table).select(
      `${this.table}.id`,
      `${this.table}.name`,
      `${this.table}.display_name`,
      `${this.table}.svg`,
      `${this.table}.hash`,
      usageSelect
    );
    if (filters.search) {
      const s = `%${filters.search}%`;
      q = q.where((qb) => {
        qb.where('display_name', 'like', s).orWhere('name', 'like', s);
      });
    }

    const rows = (await q
      .orderBy(`${this.table}.display_name`, 'asc')
      .orderBy(`${this.table}.name`, 'asc')
      .limit(limit)
      .offset(offset)) as Array<DbRow & { usage_count?: number | string }>;

    const totalQ = this.db<DbRow>(this.table).count<{ c: number | string }[]>({
      c: '*'
    });
    if (filters.search) {
      const s = `%${filters.search}%`;
      totalQ.where((qb) => qb.where('display_name', 'like', s).orWhere('name', 'like', s));
    }
    const totalRows = await totalQ;
    const total = Number((totalRows[0] as { c?: number | string } | undefined)?.c ?? 0);

    return { items: rows.map(toRow), total };
  }

  async findById(id: number): Promise<IconRow | null> {
    const row = await this.db<DbRow>(this.table).where({ id }).first();
    return row ? toRow(row) : null;
  }

  async findByHash(hash: string): Promise<IconRow | null> {
    const row = await this.db<DbRow>(this.table).where({ hash }).first();
    return row ? toRow(row) : null;
  }

  async create(input: IconUpsertInput, hash: string): Promise<IconRow> {
    const [inserted] = await this.db<DbRow>(this.table)
      .insert({
        name: input.name ?? null,
        display_name: input.displayName ?? input.name ?? null,
        svg: input.svg,
        hash
      })
      .returning(['id', 'name', 'display_name', 'svg', 'hash']);
    if (inserted && typeof inserted === 'object' && 'id' in inserted) {
      return toRow(inserted as DbRow);
    }
    const id = typeof inserted === 'number' ? inserted : 0;
    return {
      id,
      name: input.name ?? null,
      displayName: input.displayName ?? input.name ?? null,
      svg: input.svg,
      hash
    };
  }

  // `name` aquí guarda el nombre visible (display_name). La clave técnica
  // (`name`) NO se cambia post-creación porque el frontend la usa como id.
  async rename(id: number, displayName: string | null): Promise<IconRow | null> {
    await this.db(this.table).where({ id }).update({ display_name: displayName });
    return this.findById(id);
  }

  async updateSvg(id: number, svg: string, hash: string): Promise<IconRow | null> {
    await this.db(this.table).where({ id }).update({ svg, hash });
    return this.findById(id);
  }

  async delete(id: number): Promise<{ deleted: boolean; usageCount: number }> {
    let usageCount = 0;
    for (const t of await this.usageSources()) {
      const c = (await this.db(t)
        .where({ icon_id: id })
        .count<{ c: number | string }[]>({ c: '*' })) as Array<{ c: number | string }>;
      usageCount += Number((c[0] as { c?: number | string } | undefined)?.c ?? 0);
    }
    if (usageCount > 0) return { deleted: false, usageCount };
    const deleted = await this.db(this.table).where({ id }).del();
    return { deleted: deleted > 0, usageCount };
  }
}

module.exports = IconRepositoryImpl;
module.exports.default = IconRepositoryImpl;
