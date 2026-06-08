import type {
  ConferenceRecordSummary,
  CreateSpaceInput,
  MeetSpaceMeta
} from '../domain/meet.types';

export interface MeetPort {
  createSpace(userId: number, input: CreateSpaceInput): Promise<MeetSpaceMeta>;
  getSpace(userId: number, spaceName: string): Promise<MeetSpaceMeta>;
  endActiveConference(userId: number, spaceName: string): Promise<void>;
  listConferenceRecords(userId: number): Promise<ConferenceRecordSummary[]>;
}
