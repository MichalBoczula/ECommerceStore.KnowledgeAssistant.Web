import { Observable } from 'rxjs';
import { Answer } from '../model/answer';
import { Catalog, KnowledgeQuery } from '../model/catalog';

export abstract class KnowledgeRepository {
  abstract getCatalog(): Observable<Catalog>;
  abstract query(request: KnowledgeQuery): Observable<Answer>;
}
