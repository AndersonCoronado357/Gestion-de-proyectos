export interface DocSummary {
  id: string;
  name: string;
  modifiedAt: string | null;
  webViewLink: string | null;
}

export interface DocMeta {
  id: string;
  title: string;
  revisionId: string | null;
  url: string | null;
  bodyText: string;
}
