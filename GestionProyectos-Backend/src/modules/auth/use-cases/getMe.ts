// Use case: traer el usuario actual + roles + permisos + preferencias.
// Pensado para el endpoint GET /api/auth/me (protegido por authMiddleware).

import type { PublicUser } from '../domain/auth.types';
import { toPublicUser } from '../domain/user.mapper';
import type { UserRepositoryPort } from '../ports/user.repository';
import {
  DEFAULT_PREFERENCES,
  type UiPreferences
} from '../../preferences/domain/preferences.types';
import type { PreferencesRepositoryPort } from '../../preferences/ports/preferences.repository';

const AppError = require('../../../shared/errors/app.error');

interface GetMeDeps {
  userRepository: UserRepositoryPort;
  preferencesRepository?: PreferencesRepositoryPort;
}

interface GetMeInput {
  userId: number;
}

export interface GetMeOutput {
  user: PublicUser;
  preferences: UiPreferences;
}

module.exports =
  ({ userRepository, preferencesRepository }: GetMeDeps) =>
  async ({ userId }: GetMeInput): Promise<GetMeOutput> => {
    const full = await userRepository.findWithAccessById(userId);
    if (!full) throw AppError.unauthorized('User not found');

    let preferences: UiPreferences = DEFAULT_PREFERENCES;
    if (preferencesRepository) {
      try {
        const stored = await preferencesRepository.findByUserId(userId);
        if (stored) preferences = stored;
      } catch {
        // ignore — defaults
      }
    }

    return {
      user: toPublicUser(full, full.roles, full.permissions, full.isSuper),
      preferences
    };
  };
