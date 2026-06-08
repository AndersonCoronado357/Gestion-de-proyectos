// Tipos del dominio Google Docs.

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
  // Texto plano agregado del documento (concat de paragraphs).
  bodyText: string;
}

// ── Inputs ───────────────────────────────────────────────────────
export interface CreateDocInput {
  title: string;
}

export interface RenameDocInput {
  docId: string;
  title: string;
}

export interface ReplaceContentInput {
  docId: string;
  text: string;
}

export interface AppendTextInput {
  docId: string;
  text: string;
}
