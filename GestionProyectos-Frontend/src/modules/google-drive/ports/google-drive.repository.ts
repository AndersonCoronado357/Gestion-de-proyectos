import type {
  DriveFileMeta,
  DriveFileSummary
} from '../domain/google-drive.types.js';

export interface DriveListInput {
  query?: string;
  folderId?: string;
  pageSize?: number;
  includeTrashed?: boolean;
}

export interface GoogleDriveRepository {
  listFiles(input?: DriveListInput): Promise<DriveFileSummary[]>;
  getFile(id: string): Promise<DriveFileMeta | null>;
  createFolder(name: string, parentId?: string): Promise<DriveFileMeta | null>;
  renameFile(id: string, name: string): Promise<DriveFileMeta | null>;
  moveFile(id: string, newParentId: string): Promise<DriveFileMeta | null>;
  trashFile(id: string): Promise<void>;
  restoreFile(id: string): Promise<DriveFileMeta | null>;
  deleteFile(id: string): Promise<void>;
}
