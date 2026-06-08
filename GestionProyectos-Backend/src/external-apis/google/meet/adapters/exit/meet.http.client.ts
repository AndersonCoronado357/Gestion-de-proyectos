// Meet REST API v2 — el SDK googleapis NO la expone como un cliente
// dedicado todavía (Jun 2026), así que llamamos por HTTP directo con
// el access token resuelto.

import type {
  ConferenceRecordSummary,
  CreateSpaceInput,
  MeetSpaceMeta
} from '../../domain/meet.types';
import type { MeetPort } from '../../ports/meet.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

const BASE = 'https://meet.googleapis.com/v2';

interface RawSpace {
  name?: string;
  meetingUri?: string;
  meetingCode?: string;
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
}

interface RawConferenceRecord {
  name?: string;
  space?: string;
  startTime?: string;
  endTime?: string;
}

function toSpace(s: RawSpace): MeetSpaceMeta {
  return {
    name: s.name ?? '',
    meetingUri: s.meetingUri ?? null,
    meetingCode: s.meetingCode ?? null,
    accessType: s.config?.accessType ?? null,
    entryPointAccess: s.config?.entryPointAccess ?? null
  };
}

function toRecord(r: RawConferenceRecord): ConferenceRecordSummary {
  return {
    name: r.name ?? '',
    spaceName: r.space ?? null,
    startedAt: r.startTime ?? null,
    endedAt: r.endTime ?? null
  };
}

async function call<T>(
  resolve: ResolveAccessToken,
  userId: number,
  path: string,
  init: RequestInit = {}
): Promise<T | null> {
  const tok = await resolve(userId);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tok.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      (data as { error?: { message?: string } } | null)?.error?.message ||
      `Meet ${res.status}`;
    throw AppError.badGateway(`Google: ${msg}`);
  }
  return data as T;
}

export function buildMeetHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): MeetPort {
  const resolve = deps.resolveAccessToken;

  return {
    async createSpace(userId, input: CreateSpaceInput) {
      const body = input.accessType
        ? { config: { accessType: input.accessType } }
        : {};
      const r = await call<RawSpace>(resolve, userId, '/spaces', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return toSpace(r ?? {});
    },

    async getSpace(userId, spaceName) {
      // `spaceName` es algo como "spaces/abc123" — lo metemos tal cual.
      const r = await call<RawSpace>(resolve, userId, `/${spaceName}`);
      return toSpace(r ?? {});
    },

    async endActiveConference(userId, spaceName) {
      await call(resolve, userId, `/${spaceName}:endActiveConference`, {
        method: 'POST'
      });
    },

    async listConferenceRecords(userId) {
      const r = await call<{ conferenceRecords?: RawConferenceRecord[] }>(
        resolve,
        userId,
        '/conferenceRecords'
      );
      return (r?.conferenceRecords ?? []).map(toRecord);
    }
  };
}
