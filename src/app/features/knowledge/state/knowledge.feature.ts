import { createFeature, createReducer, on } from '@ngrx/store';
import { Answer } from '../domain/model/answer';
import { Catalog } from '../domain/model/catalog';
import { KnowledgeActions as A } from './knowledge.actions';

export interface KnowledgeState {
  catalog: Catalog | null;
  snapshotId: string;
  service: string;
  question: string;
  askedQuestion: string;
  loading: boolean;
  error: string;
  answer: Answer | null;
}
const initialState: KnowledgeState = {
  catalog: null,
  snapshotId: '',
  service: 'products',
  question: '',
  askedQuestion: '',
  loading: false,
  error: '',
  answer: null,
};
export const knowledgeFeature = createFeature({
  name: 'knowledge',
  reducer: createReducer(
    initialState,
    on(A.loadCatalog, (s) => ({ ...s, catalog: null, answer: null, loading: false, error: '' })),
    on(A.catalogLoaded, (s, { catalog }) => ({
      ...s,
      catalog,
      snapshotId: catalog.snapshots[0].id,
      service: catalog.snapshots[0].services[0] ?? 'products',
    })),
    on(A.catalogFailed, A.queryFailed, (s, { error }) => ({ ...s, error, loading: false })),
    on(A.serviceChanged, (s, { service }) => ({
      ...s,
      service,
      answer: null,
      loading: false,
      error: '',
    })),
    on(A.snapshotChanged, (s, { snapshotId }) => {
      const services = s.catalog?.snapshots.find((v) => v.id === snapshotId)?.services ?? [];
      return {
        ...s,
        snapshotId,
        service: services.includes(s.service) ? s.service : (services[0] ?? 'products'),
        answer: null,
        loading: false,
        error: '',
      };
    }),
    on(A.questionChanged, (s, { question }) => ({ ...s, question })),
    on(A.ask, (s) => ({
      ...s,
      answer: null,
      loading: true,
      error: '',
      askedQuestion: s.question.trim(),
    })),
    on(A.answered, (s, { answer }) => ({ ...s, answer, loading: false })),
  ),
});
