export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface Source {
  id: string;
  service: string;
  snapshotId: string;
  path: string;
  commitSha: string;
  bundleSha256: string;
  title: string;
  url?: string | null;
}
export interface Rule {
  field: string;
  description: string;
  sourceIds: string[];
}
interface SectionBase {
  title: string;
  sourceIds: string[];
}
export interface ExplanationSection extends SectionBase {
  type: 'explanation';
  content: string;
}
export interface ValidationSection extends SectionBase {
  type: 'validation';
  rules: Rule[];
}
export interface ContractSection extends SectionBase {
  type: 'api_contract';
  method: string;
  path: string;
  operationId: string;
  mediaType: string;
  requestSchema: Record<string, JsonValue>;
  referenceSchemas: Record<string, JsonValue>;
  exampleRequest: JsonValue;
  exampleOrigin: 'openapi' | 'generated' | 'unavailable';
  exampleSchemaValid: boolean | null;
}
export interface ScenarioSection extends SectionBase {
  type: 'scenario';
  content: string;
  executionStatus?: string | null;
}
export type Section = ExplanationSection | ValidationSection | ContractSection | ScenarioSection;
export interface Answer {
  schemaVersion: 1;
  requestId: string;
  snapshotId: string;
  service: string;
  status: 'answered' | 'partial' | 'not_found';
  answerMode: 'evidence' | 'model';
  retrievalMode: 'local_keyword' | 'azure_hybrid';
  isDemo: boolean;
  sections: Section[];
  sources: Source[];
  limitations: string[];
}
