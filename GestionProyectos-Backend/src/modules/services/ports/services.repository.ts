// Port del catálogo de servicios (cargos).

import type { ServiceItem } from '../domain/service.types';

export interface ServicesRepositoryPort {
  list(): Promise<ServiceItem[]>;
}

class ServicesRepository implements ServicesRepositoryPort {
  async list(): Promise<ServiceItem[]> {
    throw new Error('Not implemented');
  }
}

module.exports = ServicesRepository;
module.exports.default = ServicesRepository;
