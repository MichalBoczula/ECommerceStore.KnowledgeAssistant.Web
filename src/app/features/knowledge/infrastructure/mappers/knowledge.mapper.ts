import { isUntypedNode } from '@microsoft/kiota-abstractions';
import type * as Api from '../../../../shared/infrastructure/api-clients/knowledge/models';
import { Answer, JsonValue, Section } from '../../domain/model/answer';
import { Catalog } from '../../domain/model/catalog';
import { KnowledgeError } from '../../domain/model/knowledge-error';

function invalid(): never {
  throw new KnowledgeError('invalid_response');
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : invalid();
}
function bool(value: unknown): boolean {
  return typeof value === 'boolean' ? value : invalid();
}
function strings(value: unknown): string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : invalid();
}
function choice<T extends string>(value: unknown, allowed: readonly T[]): T {
  return allowed.includes(value as T) ? (value as T) : invalid();
}
function json(value: unknown): JsonValue {
  if (isUntypedNode(value)) return json(value.getValue());
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(json);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, json(child)]));
  }
  return invalid();
}
function section(dto: Api.AnswerSection): Section {
  const common = { title: text(dto.title), sourceIds: strings(dto.sourceIds) };
  switch (dto.type) {
    case 'explanation':
      return {
        ...common,
        type: 'explanation',
        content: text((dto as Api.ExplanationSection).content),
      };
    case 'scenario': {
      const s = dto as Api.ScenarioSection;
      return {
        ...common,
        type: 'scenario',
        content: text(s.content),
        executionStatus: s.executionStatus ?? null,
      };
    }
    case 'validation': {
      const s = dto as Api.ValidationSection;
      if (!s.rules) return invalid();
      return {
        ...common,
        type: 'validation',
        rules: s.rules.map((r) => ({
          field: text(r.field),
          description: text(r.description),
          sourceIds: strings(r.sourceIds),
        })),
      };
    }
    case 'api_contract': {
      const s = dto as Api.ContractSection;
      return {
        ...common,
        type: 'api_contract',
        method: text(s.method),
        path: text(s.path),
        operationId: text(s.operationId),
        mediaType: text(s.mediaType),
        requestSchema: json(s.requestSchema?.additionalData ?? {}) as Record<string, JsonValue>,
        referenceSchemas: json(s.referenceSchemas?.additionalData ?? {}) as Record<
          string,
          JsonValue
        >,
        exampleRequest: s.exampleRequest == null ? null : json(s.exampleRequest),
        exampleOrigin: choice(s.exampleOrigin, ['openapi', 'generated', 'unavailable']),
        exampleSchemaValid: s.exampleSchemaValid == null ? null : bool(s.exampleSchemaValid),
      };
    }
    default:
      return invalid();
  }
}
export function mapAnswer(dto: Api.Answer | undefined): Answer {
  if (!dto || dto.schemaVersion !== 1 || !dto.sections || !dto.sources) return invalid();
  return {
    schemaVersion: 1,
    requestId: text(dto.requestId),
    snapshotId: text(dto.snapshotId),
    service: text(dto.service),
    status: choice(dto.status, ['answered', 'partial', 'not_found']),
    answerMode: choice(dto.answerMode, ['evidence', 'model']),
    retrievalMode: choice(dto.retrievalMode, ['local_keyword', 'azure_hybrid']),
    isDemo: bool(dto.isDemo),
    sections: dto.sections.map(section),
    sources: dto.sources.map((s) => ({
      id: text(s.id),
      service: text(s.service),
      snapshotId: text(s.snapshotId),
      path: text(s.path),
      commitSha: text(s.commitSha),
      bundleSha256: text(s.bundleSha256),
      title: text(s.title),
      url: s.url ?? null,
    })),
    limitations: strings(dto.limitations),
  };
}
export function mapCatalog(dto: Api.Catalog | undefined): Catalog {
  if (!dto || dto.schemaVersion !== 1 || !dto.snapshots?.length) return invalid();
  return {
    schemaVersion: 1,
    answerMode: choice(dto.answerMode, ['evidence', 'model']),
    retrievalMode: choice(dto.retrievalMode, ['local_keyword', 'azure_hybrid']),
    snapshots: dto.snapshots.map((s) => ({
      id: text(s.id),
      version: text(s.version),
      isDemo: bool(s.isDemo),
      services: strings(s.services),
    })),
  };
}
export function mapKnowledgeError(error: unknown): KnowledgeError {
  if (error instanceof KnowledgeError) return error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const p = error as Api.ApiProblemDetails;
    if (typeof p.code === 'string') return new KnowledgeError(p.code, p.traceId ?? undefined);
  }
  return new KnowledgeError('unavailable');
}
