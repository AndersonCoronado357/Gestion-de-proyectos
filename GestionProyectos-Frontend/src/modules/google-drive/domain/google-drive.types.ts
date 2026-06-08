export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
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
