import type { NextFunction, Request, Response } from 'express';
import type { ServiceItem } from '../../domain/service.types';

interface UseCases {
  list: () => Promise<ServiceItem[]>;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await useCases.list();
      res.json({ services });
    } catch (e) {
      next(e);
    }
  }
});
