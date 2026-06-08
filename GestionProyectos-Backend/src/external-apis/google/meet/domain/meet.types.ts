// Tipos del dominio Google Meet (Meet REST API v2).
// API limitada: lo principal son `spaces` (salas) y `conferenceRecords`
// (registros de reuniones pasadas).

export interface MeetSpaceMeta {
  name: string;
  meetingUri: string | null;
  meetingCode: string | null;
  // 'OPEN' | 'TRUSTED' | 'RESTRICTED' — quién puede entrar.
  accessType: string | null;
  // 'HOSTS_ONLY' | 'NO_RESTRICTION' — quién puede compartir pantalla.
  entryPointAccess: string | null;
}

export interface ConferenceRecordSummary {
  name: string;
  spaceName: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

// ── Inputs ───────────────────────────────────────────────────────
export interface CreateSpaceInput {
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
}
