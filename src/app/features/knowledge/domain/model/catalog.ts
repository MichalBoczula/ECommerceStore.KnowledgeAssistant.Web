export interface Snapshot {
  id: string;
  version: string;
  isDemo: boolean;
  services: string[];
}
export interface Catalog {
  schemaVersion: 1;
  snapshots: Snapshot[];
  answerMode: 'evidence' | 'model';
  retrievalMode: 'local_keyword' | 'azure_hybrid';
}
export interface KnowledgeQuery {
  question: string;
  service: 'products' | 'users' | 'invoices' | 'payments';
  snapshotId: string;
}
