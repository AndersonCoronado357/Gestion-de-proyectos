// Implementación Knex del Anderson3Repository.

import type { Knex } from 'knex';

const Anderson3Repository = require('../../ports/anderson3.repository');
const Anderson3 = require('../../domain/anderson3.entity');

interface Anderson3Row {
  id: number;
  name: string;
  description: string | null;
  is_active: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

interface Anderson3UpdateColumns {
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

const toEntity = (row: Anderson3Row | undefined) =>
  row &&
  new Anderson3({
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

class Anderson3RepositoryImpl extends Anderson3Repository {
  private db: Knex;
  private table = 'anderson3';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async findAll({ limit, offset }: { limit: number; offset: number }) {
    const [rows, [{ count }]] = await Promise.all([
      this.db<Anderson3Row>(this.table)
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.db(this.table).count<[{ count: string | number }]>({ count: '*' })
    ]);
    return { items: rows.map((r) => toEntity(r)), total: Number(count) };
  }

  async findById(id: number) {
    const row = await this.db<Anderson3Row>(this.table).where({ id }).first();
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
    const [row] = await this.db<Anderson3Row>(this.table)
      .insert({
        name,
        description: description ?? null,
        is_active: (isActive ?? true) as unknown as number
      })
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as Anderson3Row);
  }

  async update(id: number, { name, description, isActive }: UpdateInput) {
    const updates: Anderson3UpdateColumns = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;
    const [row] = await this.db<Anderson3Row>(this.table)
      .where({ id })
      .update(updates)
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as Anderson3Row);
  }

  async delete(id: number) {
    return this.db(this.table).where({ id }).del();
  }
}

module.exports = Anderson3RepositoryImpl;
module.exports.default = Anderson3RepositoryImpl;
