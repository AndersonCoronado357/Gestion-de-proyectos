// Implementación del DrivePort usando el SDK `googleapis`.

import { google, drive_v3 } from 'googleapis';
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  CreateFolderInput,
  DriveFileMeta,
  DriveFileSummary,
  ListFilesInput,
  MoveFileInput,
  RenameFileInput
} from '../../domain/drive.types';
import type { DrivePort } from '../../ports/drive.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function toSummary(f: drive_v3.Schema$File): DriveFileSummary {
  return {
    id: f.id ?? '',
    name: f.name ?? '(sin nombre)',
    mimeType: f.mimeType ?? '',
    isFolder: f.mimeType === FOLDER_MIME,
    parents: f.parents ?? [],
    modifiedAt: f.modifiedTime ?? null,
    size: f.size ? Number(f.size) : null,
    webViewLink: f.webViewLink ?? null,
    iconLink: f.iconLink ?? null,
    trashed: Boolean(f.trashed)
  };
}

function toMeta(f: drive_v3.Schema$File): DriveFileMeta {
  return {
    ...toSummary(f),
    description: f.description ?? null,
    createdAt: f.createdTime ?? null,
    starred: Boolean(f.starred),
    ownedByMe: Boolean(f.ownedByMe),
    owners:
      f.owners?.map((o) => ({
        displayName: o.displayName ?? null,
        emailAddress: o.emailAddress ?? null
      })) ?? []
  };
}

const FIELDS_BASIC =
  'id,name,mimeType,parents,modifiedTime,size,webViewLink,iconLink,trashed';
const FIELDS_FULL = `${FIELDS_BASIC},description,createdTime,starred,ownedByMe,owners(displayName,emailAddress)`;

async function withDrive<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (d: drive_v3.Drive) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const drive = google.drive({ version: 'v3', auth });
  try {
    return await fn(drive);
  } catch (e) {
    throw AppError.badGateway(extractGoogleError(e));
  }
}

function extractGoogleError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { errors?: Array<{ message?: string }>; message?: string };
    if (err.errors?.[0]?.message) return `Google: ${err.errors[0].message}`;
    if (err.message) return `Google: ${err.message}`;
  }
  return 'Google: error desconocido';
}

export function buildDriveHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): DrivePort {
  const resolve = deps.resolveAccessToken;

  return {
    async listFiles(userId, input) {
      return withDrive(resolve, userId, async (drive) => {
        const parts: string[] = [];
        if (input.folderId) parts.push(`'${input.folderId}' in parents`);
        if (!input.includeTrashed) parts.push('trashed = false');
        if (input.query?.trim())
          parts.push(`name contains '${input.query.replace(/'/g, "\\'")}'`);
        const q = parts.join(' and ');
        const r = await drive.files.list({
          q: q || undefined,
          fields: `files(${FIELDS_BASIC})`,
          pageSize: input.pageSize ?? 100,
          orderBy: 'folder,name,modifiedTime desc'
        });
        return (r.data.files ?? []).map(toSummary);
      });
    },

    async getFile(userId, fileId) {
      return withDrive(resolve, userId, async (drive) => {
        const r = await drive.files.get({ fileId, fields: FIELDS_FULL });
        return toMeta(r.data);
      });
    },

    async createFolder(userId, input: CreateFolderInput) {
      return withDrive(resolve, userId, async (drive) => {
        const r = await drive.files.create({
          requestBody: {
            name: input.name,
            mimeType: FOLDER_MIME,
            ...(input.parentId ? { parents: [input.parentId] } : {})
          },
          fields: FIELDS_FULL
        });
        return toMeta(r.data);
      });
    },

    async renameFile(userId, input: RenameFileInput) {
      return withDrive(resolve, userId, async (drive) => {
        const r = await drive.files.update({
          fileId: input.fileId,
          requestBody: { name: input.name },
          fields: FIELDS_FULL
        });
        return toMeta(r.data);
      });
    },

    async moveFile(userId, input: MoveFileInput) {
      return withDrive(resolve, userId, async (drive) => {
        // Para mover en Drive v3 hay que pasar addParents/removeParents.
        const cur = await drive.files.get({
          fileId: input.fileId,
          fields: 'parents'
        });
        const prev = (cur.data.parents ?? []).join(',');
        const r = await drive.files.update({
          fileId: input.fileId,
          addParents: input.newParentId,
          removeParents: prev || undefined,
          fields: FIELDS_FULL
        });
        return toMeta(r.data);
      });
    },

    async trashFile(userId, fileId) {
      await withDrive(resolve, userId, async (drive) => {
        await drive.files.update({ fileId, requestBody: { trashed: true } });
      });
    },

    async restoreFile(userId, fileId) {
      return withDrive(resolve, userId, async (drive) => {
        const r = await drive.files.update({
          fileId,
          requestBody: { trashed: false },
          fields: FIELDS_FULL
        });
        return toMeta(r.data);
      });
    },

    async deleteFile(userId, fileId) {
      await withDrive(resolve, userId, async (drive) => {
        await drive.files.delete({ fileId });
      });
    }
  };
}
