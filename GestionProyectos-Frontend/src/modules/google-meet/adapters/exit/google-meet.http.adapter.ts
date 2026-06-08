import { http } from '../../../../shared/utils/http.js';
import type {
  ConferenceRecordSummary,
  MeetSpaceMeta
} from '../../domain/google-meet.types.js';
import type { GoogleMeetRepository } from '../../ports/google-meet.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleMeetHttp: GoogleMeetRepository = {
  async createSpace(accessType) {
    return http<MeetSpaceMeta>('/external-apis/google/meet/spaces', {
      method: 'POST',
      body: accessType ? { accessType } : {}
    });
  },

  async getSpace(spaceId) {
    return http<MeetSpaceMeta>(
      `/external-apis/google/meet/spaces/${enc(spaceId)}`,
      { method: 'GET' }
    );
  },

  async endActiveConference(spaceId) {
    await http(
      `/external-apis/google/meet/spaces/${enc(spaceId)}/end-active`,
      { method: 'POST' }
    );
  },

  async listConferenceRecords(): Promise<ConferenceRecordSummary[]> {
    const r = await http<{ items: ConferenceRecordSummary[] }>(
      '/external-apis/google/meet/conference-records',
      { method: 'GET' }
    );
    return r?.items ?? [];
  }
};
