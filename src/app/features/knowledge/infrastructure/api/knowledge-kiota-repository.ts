import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  createKnowledgeApiClient,
  KnowledgeApiClient,
} from '../../../../shared/infrastructure/api-clients/knowledge/knowledgeApiClient';
import {
  createKnowledgeRequestAdapter,
  KNOWLEDGE_API_BASE_URL,
} from '../../../../shared/infrastructure/knowledge-request-adapter';
import { KnowledgeRepository } from '../../domain/interfaces/knowledge-repository.port';
import { Answer } from '../../domain/model/answer';
import { Catalog, KnowledgeQuery } from '../../domain/model/catalog';
import { mapAnswer, mapCatalog, mapKnowledgeError } from '../mappers/knowledge.mapper';

@Injectable()
export class KnowledgeKiotaRepository implements KnowledgeRepository {
  private readonly baseUrl = inject(KNOWLEDGE_API_BASE_URL);
  getCatalog(): Observable<Catalog> {
    return this.execute(async (api) => mapCatalog(await api.api.v1.catalog.get()));
  }
  query(request: KnowledgeQuery): Observable<Answer> {
    return this.execute(async (api) => mapAnswer(await api.api.v1.query.post(request)));
  }
  private execute<T>(operation: (api: KnowledgeApiClient) => Promise<T>): Observable<T> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      const api = createKnowledgeApiClient(
        createKnowledgeRequestAdapter(this.baseUrl, controller.signal),
      );
      void operation(api).then(
        (value) => {
          subscriber.next(value);
          subscriber.complete();
        },
        (error: unknown) => subscriber.error(mapKnowledgeError(error)),
      );
      return () => controller.abort();
    });
  }
}
