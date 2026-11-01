import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Answer } from '../domain/model/answer';
import { Catalog } from '../domain/model/catalog';

export const KnowledgeActions = createActionGroup({
  source: 'Knowledge',
  events: {
    'Load Catalog': emptyProps(),
    'Catalog Loaded': props<{ catalog: Catalog }>(),
    'Catalog Failed': props<{ error: string }>(),
    'Service Changed': props<{ service: string }>(),
    'Snapshot Changed': props<{ snapshotId: string }>(),
    'Question Changed': props<{ question: string }>(),
    Ask: emptyProps(),
    Answered: props<{ answer: Answer }>(),
    'Query Failed': props<{ error: string }>(),
  },
});
