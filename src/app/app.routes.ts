import { Routes } from '@angular/router';
import { provideKnowledge } from './features/knowledge/knowledge.providers';
export const routes: Routes = [
  {
    path: '',
    providers: [provideKnowledge()],
    loadComponent: () =>
      import('./features/knowledge/presentation/knowledge-page/knowledge-page').then(
        (m) => m.KnowledgePage,
      ),
  },
  { path: '**', redirectTo: '' },
];
