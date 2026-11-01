import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, takeUntil, withLatestFrom } from 'rxjs';
import { KnowledgeRepository } from '../domain/interfaces/knowledge-repository.port';
import { KnowledgeQuery } from '../domain/model/catalog';
import { knowledgeErrorMessage } from '../domain/model/knowledge-error';
import { KnowledgeActions as A } from './knowledge.actions';
import { knowledgeFeature } from './knowledge.feature';

@Injectable()
export class KnowledgeEffects {
  private readonly actions = inject(Actions);
  private readonly repository = inject(KnowledgeRepository);
  private readonly store = inject(Store);
  readonly catalog = createEffect(() =>
    this.actions.pipe(
      ofType(A.loadCatalog),
      switchMap(() =>
        this.repository.getCatalog().pipe(
          map((catalog) => A.catalogLoaded({ catalog })),
          catchError((error: unknown) =>
            of(A.catalogFailed({ error: knowledgeErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );
  readonly query = createEffect(() =>
    this.actions.pipe(
      ofType(A.ask),
      withLatestFrom(this.store.select(knowledgeFeature.selectKnowledgeState)),
      switchMap(([, state]) => {
        const request: KnowledgeQuery = {
          question: state.askedQuestion,
          service: state.service as KnowledgeQuery['service'],
          snapshotId: state.snapshotId,
        };
        return this.repository.query(request).pipe(
          map((answer) =>
            answer.snapshotId === request.snapshotId && answer.service === request.service
              ? A.answered({ answer })
              : A.queryFailed({
                  error: 'The response did not match the selected documentation snapshot.',
                }),
          ),
          catchError((error: unknown) =>
            of(A.queryFailed({ error: knowledgeErrorMessage(error) })),
          ),
          takeUntil(this.actions.pipe(ofType(A.serviceChanged, A.snapshotChanged, A.loadCatalog))),
        );
      }),
    ),
  );
}
