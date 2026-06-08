import type { DocMeta, DocSummary } from '../domain/google-docs.types.js';

export interface GoogleDocsRepository {
  listDocs(): Promise<DocSummary[]>;
  getDoc(id: string): Promise<DocMeta | null>;
  createDoc(title: string): Promise<DocMeta | null>;
  renameDoc(id: string, title: string): Promise<DocMeta | null>;
  deleteDoc(id: string): Promise<void>;
  replaceContent(id: string, text: string): Promise<DocMeta | null>;
  appendText(id: string, text: string): Promise<DocMeta | null>;
}
