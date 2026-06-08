import type {
  CreateFolderInput,
  DriveFileMeta,
  DriveFileSummary,
  ListFilesInput,
  MoveFileInput,
  RenameFileInput
} from '../domain/drive.types';

export interface DrivePort {
  listFiles(userId: number, input: ListFilesInput): Promise<DriveFileSummary[]>;
  getFile(userId: number, fileId: string): Promise<DriveFileMeta>;
  createFolder(userId: number, input: CreateFolderInput): Promise<DriveFileMeta>;
  renameFile(userId: number, input: RenameFileInput): Promise<DriveFileMeta>;
  moveFile(userId: number, input: MoveFileInput): Promise<DriveFileMeta>;
  trashFile(userId: number, fileId: string): Promise<void>;
  restoreFile(userId: number, fileId: string): Promise<DriveFileMeta>;
  deleteFile(userId: number, fileId: string): Promise<void>;
}
