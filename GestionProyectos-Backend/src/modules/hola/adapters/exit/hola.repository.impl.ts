// Implementación Knex del HolaRepository.

import type { Knex } from 'knex';

const HolaRepository = require('../../ports/hola.repository');
const Hola = require('../../domain/hola.entity');

interface HolaRow {
  id: number;
  name: string;
  description: string | null;
  is_active: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

interface HolaUpdateColumns {
  updated_at: Date;
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

interface UpdateInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

const toEntity = (row: HolaRow | undefined) =>
  row &&
  new Hola({
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

class HolaRepositoryImpl extends HolaRepository {
  private db: Knex;
  private table = 'hola';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async findAll({ limit, offset }: { limit: number; offset: number }) {
    const [rows, [{ count }]] = await Promise.all([
      this.db<HolaRow>(this.table)
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.db(this.table).count<[{ count: string | number }]>({ count: '*' })
    ]);
    return { items: rows.map((r) => toEntity(r)), total: Number(count) };
  }

  async findById(id: number) {
    const row = await this.db<HolaRow>(this.table).where({ id }).first();
    return toEntity(row);
  }

  async create({
    name,
    description,
    isActive
  }: {
    name: string;
    description?: string | null;
    isActive?: boolean;
  }) {
    const [row] = await this.db<HolaRow>(this.table)
      .insert({
        name,
        description: description ?? null,
        is_active: (isActive ?? true) as unknown as number
      })
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as HolaRow);
  }

  async update(id: number, { name, description, isActive }: UpdateInput) {
    const updates: HolaUpdateColumns = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;
    const [row] = await this.db<HolaRow>(this.table)
      .where({ id })
      .update(updates)
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as HolaRow);
  }

  async delete(id: number) {
    return this.db(this.table).where({ id }).del();
  }
}

module.exports = HolaRepositoryImpl;
module.exports.default = HolaRepositoryImpl;
