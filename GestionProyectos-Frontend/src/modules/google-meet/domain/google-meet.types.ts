export interface MeetSpaceMeta {
  name: string;
  meetingUri: string | null;
  meetingCode: string | null;
  accessType: string | null;
  entryPointAccess: string | null;
}

export interface ConferenceRecordSummary {
  name: string;
  spaceName: string | null;
  startedAt: string | null;
  endedAt: string | null;
}
