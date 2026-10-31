/* Generated from the Python API response schema. Run npm run generate:contract. */

export type Schemaversion = 1;
export type Requestid = string;
export type Snapshotid = string;
export type Service = string;
export type Status = 'answered' | 'partial' | 'not_found';
export type Answermode = 'evidence' | 'model';
export type Retrievalmode = 'local_keyword' | 'azure_hybrid';
export type Isdemo = boolean;
export type Type = 'explanation';
export type Title = string;
export type Content = string;
export type Sourceids = string[];
export type Type1 = 'validation';
export type Title1 = string;
export type Field = string;
export type Description = string;
export type Sourceids1 = string[];
export type Rules = Rule[];
export type Sourceids2 = string[];
export type Type2 = 'api_contract';
export type Title2 = string;
export type Method = string;
export type Path = string;
export type Operationid = string;
export type Mediatype = string;
export type JsonValue = unknown;
export type Exampleorigin = 'openapi' | 'generated' | 'unavailable';
export type Exampleschemavalid = boolean | null;
export type Sourceids3 = string[];
export type Type3 = 'scenario';
export type Title3 = string;
export type Content1 = string;
export type Executionstatus = string | null;
export type Sourceids4 = string[];
export type Sections = (
  ExplanationSection | ValidationSection | ContractSection | ScenarioSection
)[];
export type Id = string;
export type Service1 = string;
export type Snapshotid1 = string;
export type Path1 = string;
export type Commitsha = string;
export type Bundlesha256 = string;
export type Title4 = string;
export type Url = string | null;
export type Sources = Source[];
export type Limitations = string[];

export interface Answer {
  schemaVersion?: Schemaversion;
  requestId: Requestid;
  snapshotId: Snapshotid;
  service: Service;
  status: Status;
  answerMode: Answermode;
  retrievalMode: Retrievalmode;
  isDemo: Isdemo;
  sections: Sections;
  sources: Sources;
  limitations: Limitations;
}
export interface ExplanationSection {
  type: Type;
  title: Title;
  content: Content;
  sourceIds: Sourceids;
}
export interface ValidationSection {
  type: Type1;
  title: Title1;
  rules: Rules;
  sourceIds: Sourceids2;
}
export interface Rule {
  field: Field;
  description: Description;
  sourceIds: Sourceids1;
}
export interface ContractSection {
  type: Type2;
  title: Title2;
  method: Method;
  path: Path;
  operationId: Operationid;
  mediaType: Mediatype;
  requestSchema: Requestschema;
  exampleRequest: unknown;
  exampleOrigin: Exampleorigin;
  exampleSchemaValid: Exampleschemavalid;
  referenceSchemas: Referenceschemas;
  sourceIds: Sourceids3;
}
export interface Requestschema {
  [k: string]: JsonValue;
}
export interface Referenceschemas {
  [k: string]: JsonValue;
}
export interface ScenarioSection {
  type: Type3;
  title: Title3;
  content: Content1;
  executionStatus?: Executionstatus;
  sourceIds: Sourceids4;
}
export interface Source {
  id: Id;
  service: Service1;
  snapshotId: Snapshotid1;
  path: Path1;
  commitSha: Commitsha;
  bundleSha256: Bundlesha256;
  title: Title4;
  url?: Url;
}
