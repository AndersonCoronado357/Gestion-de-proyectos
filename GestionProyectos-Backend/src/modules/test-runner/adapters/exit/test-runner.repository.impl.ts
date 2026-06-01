// Implementación Knex del TestRunnerRepository.

import type { Knex } from 'knex';

const TestRunnerRepository = require('../../ports/test-runner.repository');
const TestRunner = require('../../domain/test-runner.entity');

interface TestRunnerRow {
  id: number;
  name: string;
  description: string | null;
  is_active: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

interface TestRunnerUpdateColumns {
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

const toEntity = (row: TestRunnerRow | undefined) =>
  row &&
  new TestRunner({
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

class TestRunnerRepositoryImpl extends TestRunnerRepository {
  private db: Knex;
  private table = 'test_runner';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async findAll({ limit, offset }: { limit: number; offset: number }) {
    const [rows, [{ count }]] = await Promise.all([
      this.db<TestRunnerRow>(this.table)
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.db(this.table).count<[{ count: string | number }]>({ count: '*' })
    ]);
    return { items: rows.map((r) => toEntity(r)), total: Number(count) };
  }

  async findById(id: number) {
    const row = await this.db<TestRunnerRow>(this.table).where({ id }).first();
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
    const [row] = await this.db<TestRunnerRow>(this.table)
      .insert({
        name,
        description: description ?? null,
        is_active: (isActive ?? true) as unknown as number
      })
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as TestRunnerRow);
  }

  async update(id: number, { name, description, isActive }: UpdateInput) {
    const updates: TestRunnerUpdateColumns = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;
    const [row] = await this.db<TestRunnerRow>(this.table)
      .where({ id })
      .update(updates)
      .returning(['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']);
    return toEntity(row as TestRunnerRow);
  }

  async delete(id: number) {
    return this.db(this.table).where({ id }).del();
  }
}

module.exports = TestRunnerRepositoryImpl;
module.exports.default = TestRunnerRepositoryImpl;
