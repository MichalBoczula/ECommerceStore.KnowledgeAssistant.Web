import { makeEnvironmentProviders } from '@angular/core';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { KnowledgeRepository } from './domain/interfaces/knowledge-repository.port';
import { KnowledgeKiotaRepository } from './infrastructure/api/knowledge-kiota-repository';
import { KnowledgeFacade } from './application/knowledge.facade';
import { knowledgeFeature } from './state/knowledge.feature';
import { KnowledgeEffects } from './state/knowledge.effects';

export function provideKnowledge() {
  return makeEnvironmentProviders([
    provideState(knowledgeFeature),
    provideEffects(KnowledgeEffects),
    KnowledgeFacade,
    { provide: KnowledgeRepository, useClass: KnowledgeKiotaRepository },
  ]);
}
