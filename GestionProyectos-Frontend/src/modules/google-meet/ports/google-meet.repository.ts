import type {
  ConferenceRecordSummary,
  MeetSpaceMeta
} from '../domain/google-meet.types.js';

export interface GoogleMeetRepository {
  createSpace(accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED'): Promise<MeetSpaceMeta | null>;
  // spaceId = parte final después de `spaces/`.
  getSpace(spaceId: string): Promise<MeetSpaceMeta | null>;
  endActiveConference(spaceId: string): Promise<void>;
  listConferenceRecords(): Promise<ConferenceRecordSummary[]>;
}
