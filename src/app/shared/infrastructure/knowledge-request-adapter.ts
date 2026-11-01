import { InjectionToken } from '@angular/core';
import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter, HttpClient } from '@microsoft/kiota-http-fetchlibrary';
import { environment } from '../../../environments/environment';

export const KNOWLEDGE_API_BASE_URL = new InjectionToken<string>('Knowledge API base URL', {
  providedIn: 'root',
  factory: () => new URL(environment.apiBasePath || '/', location.origin).href.replace(/\/$/, ''),
});

export function createKnowledgeRequestAdapter(
  baseUrl: string,
  signal: AbortSignal,
): FetchRequestAdapter {
  // The same-origin Web proxy owns the API key. Cancellation aborts the actual fetch.
  const http = new HttpClient((url, init) =>
    fetch(url, { ...init, signal, credentials: 'same-origin' }),
  );
  const adapter = new FetchRequestAdapter(
    new AnonymousAuthenticationProvider(),
    undefined,
    undefined,
    http,
  );
  adapter.baseUrl = baseUrl;
  return adapter;
}
