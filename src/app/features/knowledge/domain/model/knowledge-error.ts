export class KnowledgeError extends Error {
  constructor(
    readonly code: string,
    readonly traceId?: string,
  ) {
    super(code);
  }
}
export function knowledgeErrorMessage(error: unknown): string {
  const code = error instanceof KnowledgeError ? error.code : 'unavailable';
  const messages: Record<string, string> = {
    snapshot_not_active: 'The active snapshot changed. Refresh the connection.',
    unauthorized: 'The knowledge API could not authorize this connection.',
    resource_not_found: 'This service is absent from the selected snapshot.',
    invalid_json: 'The request does not match the API contract.',
    validation_failed: 'Check the question and documentation context.',
    invalid_response: 'The API returned an unsupported response.',
    answer_verification_failed: 'The answer could not be verified against the documentation.',
  };
  return (
    (messages[code] ?? 'Retrieval or answer verification failed. Please retry.') +
    (error instanceof KnowledgeError && error.traceId ? ' Request: ' + error.traceId : '')
  );
}
