import type { ServiceItem } from '../domain/service.types';
import type { ServicesRepositoryPort } from '../ports/services.repository';

interface Deps {
  servicesRepository: ServicesRepositoryPort;
}

module.exports =
  ({ servicesRepository }: Deps) =>
  async (): Promise<ServiceItem[]> =>
    servicesRepository.list();
