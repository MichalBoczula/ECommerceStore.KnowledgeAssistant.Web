import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { KnowledgeActions as A } from '../state/knowledge.actions';
import { knowledgeFeature as F } from '../state/knowledge.feature';

@Injectable()
export class KnowledgeFacade {
  private readonly store = inject(Store);
  readonly catalog = this.store.selectSignal(F.selectCatalog);
  readonly snapshotId = this.store.selectSignal(F.selectSnapshotId);
  readonly service = this.store.selectSignal(F.selectService);
  readonly question = this.store.selectSignal(F.selectQuestion);
  readonly askedQuestion = this.store.selectSignal(F.selectAskedQuestion);
  readonly loading = this.store.selectSignal(F.selectLoading);
  readonly error = this.store.selectSignal(F.selectError);
  readonly answer = this.store.selectSignal(F.selectAnswer);
  readonly currentSnapshot = computed(() =>
    this.catalog()?.snapshots.find((s) => s.id === this.snapshotId()),
  );
  readonly canAsk = computed(
    () =>
      this.question().trim().length >= 3 &&
      this.question().trim().length <= 4000 &&
      !!this.currentSnapshot()?.services.includes(this.service()) &&
      !this.loading(),
  );
  loadCatalog() {
    this.store.dispatch(A.loadCatalog());
  }
  changeService(service: string) {
    this.store.dispatch(A.serviceChanged({ service }));
  }
  changeSnapshot(snapshotId: string) {
    this.store.dispatch(A.snapshotChanged({ snapshotId }));
  }
  setQuestion(question: string) {
    this.store.dispatch(A.questionChanged({ question }));
  }
  ask() {
    if (this.canAsk()) this.store.dispatch(A.ask());
  }
}
