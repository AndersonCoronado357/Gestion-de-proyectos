// Jest + TypeScript. Usa ts-jest sin diagnósticos full porque corre rápido
// y los typecheck reales los hace `npm run typecheck`.

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        diagnostics: false
      }
    ]
  },
  moduleFileExtensions: ['ts', 'js', 'json']
};

export default config;
