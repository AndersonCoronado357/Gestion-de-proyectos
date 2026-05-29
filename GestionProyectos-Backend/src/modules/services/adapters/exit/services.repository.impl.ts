// Implementación Knex del ServicesRepository (catálogo de cargos).

import type { Knex } from 'knex';
import type { ServiceItem } from '../../domain/service.types';
import type { ServicesRepositoryPort } from '../../ports/services.repository';

const ServicesRepository = require('../../ports/services.repository');

interface ServiceRow {
  id: number;
  code: string;
  description: string;
  health_center: string | null;
}

class ServicesRepositoryImpl
  extends ServicesRepository
  implements ServicesRepositoryPort
{
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async list(): Promise<ServiceItem[]> {
    const rows = await this.db<ServiceRow>('services')
      .whereNull('deleted_at')
      .orderBy('description', 'asc')
      .select('id', 'code', 'description', 'health_center');

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      description: r.description,
      healthCenter: r.health_center
    }));
  }
}

module.exports = ServicesRepositoryImpl;
module.exports.default = ServicesRepositoryImpl;
