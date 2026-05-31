import type { UserPresence } from './user.mapper.js';

export interface UserData {
  id?: string;
  name?: string;
  sapUser?: string;
  email?: string;
  roles?: string[];
  presence?: UserPresence;
  lastSeen?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export class User {
  id: string | undefined;
  name: string | undefined;
  sapUser: string;
  email: string | undefined;
  roles: string[];
  presence: UserPresence;
  lastSeen: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  constructor({
    id,
    name,
    sapUser,
    email,
    roles,
    presence,
    lastSeen,
    createdAt,
    updatedAt
  }: UserData = {}) {
    this.id = id;
    this.name = name;
    this.sapUser = sapUser ?? '';
    this.email = email;
    this.roles = roles ?? [];
    this.presence = presence ?? 'offline';
    this.lastSeen = lastSeen ?? null;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}
