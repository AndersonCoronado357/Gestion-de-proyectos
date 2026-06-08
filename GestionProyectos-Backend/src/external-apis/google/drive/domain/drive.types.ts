// Tipos del dominio Drive — espejo chico de la API de Google Drive v3.

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  // true si es la carpeta `application/vnd.google-apps.folder`.
  isFolder: boolean;
  parents: string[];
  modifiedAt: string | null;
  size: number | null;
  webViewLink: string | null;
  iconLink: string | null;
  trashed: boolean;
}

export interface DriveFileMeta extends DriveFileSummary {
  description: string | null;
  createdAt: string | null;
  starred: boolean;
  ownedByMe: boolean;
  owners: { displayName: string | null; emailAddress: string | null }[];
}

// ── Inputs ───────────────────────────────────────────────────────
export interface ListFilesInput {
  // Filtros opcionales — se traducen a query `q` de Drive.
  query?: string;
  folderId?: string;
  pageSize?: number;
  includeTrashed?: boolean;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

export interface RenameFileInput {
  fileId: string;
  name: string;
}

export interface MoveFileInput {
  fileId: string;
  newParentId: string;
}
