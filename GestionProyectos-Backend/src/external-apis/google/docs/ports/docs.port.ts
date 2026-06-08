import type {
  AppendTextInput,
  CreateDocInput,
  DocMeta,
  DocSummary,
  RenameDocInput,
  ReplaceContentInput
} from '../domain/docs.types';

export interface DocsPort {
  listDocs(userId: number): Promise<DocSummary[]>;
  getDoc(userId: number, docId: string): Promise<DocMeta>;
  createDoc(userId: number, input: CreateDocInput): Promise<DocMeta>;
  renameDoc(userId: number, input: RenameDocInput): Promise<DocMeta>;
  deleteDoc(userId: number, docId: string): Promise<void>;
  replaceContent(userId: number, input: ReplaceContentInput): Promise<DocMeta>;
  appendText(userId: number, input: AppendTextInput): Promise<DocMeta>;
}
