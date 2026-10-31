import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { of, Subject } from 'rxjs';
import { KnowledgeFacade } from './knowledge.facade';
import { KnowledgeRepository } from '../domain/interfaces/knowledge-repository.port';
import { Answer } from '../domain/model/answer';
import { Catalog } from '../domain/model/catalog';
import { KnowledgeError } from '../domain/model/knowledge-error';
import { provideKnowledge } from '../knowledge.providers';
import { KnowledgePage } from '../presentation/knowledge-page/knowledge-page';

const catalog: Catalog = {
  schemaVersion: 1,
  snapshots: [{ id: 'demo-v1', version: 'demo', isDemo: true, services: ['products', 'payments'] }],
  answerMode: 'evidence',
  retrievalMode: 'local_keyword',
};
const empty: Answer = {
  schemaVersion: 1,
  requestId: 'r',
  snapshotId: 'demo-v1',
  service: 'products',
  status: 'not_found',
  answerMode: 'evidence',
  retrievalMode: 'local_keyword',
  isDemo: true,
  sections: [],
  sources: [],
  limitations: [],
};
describe('Knowledge facade and page', () => {
  let results: Subject<Answer>;
  let facade: KnowledgeFacade;
  let requests: unknown[];
  beforeEach(() => {
    results = new Subject();
    requests = [];
    TestBed.configureTestingModule({
      imports: [KnowledgePage],
      providers: [
        provideStore(),
        provideKnowledge(),
        {
          provide: KnowledgeRepository,
          useValue: {
            getCatalog: () => of(catalog),
            query: (request: unknown) => {
              requests.push(request);
              return results;
            },
          },
        },
      ],
    });
    facade = TestBed.inject(KnowledgeFacade);
  });
  function create() {
    const fixture = TestBed.createComponent(KnowledgePage);
    fixture.detectChanges();
    return fixture;
  }
  it('loads the selected context and demo label', () => {
    const fixture = create();
    expect(facade.snapshotId()).toBe('demo-v1');
    expect(fixture.nativeElement.textContent).toContain('Demonstration dataset');
  });
  it('prevents empty questions and submits the selected scope', () => {
    create();
    facade.ask();
    expect(requests).toHaveLength(0);
    facade.setQuestion(' mobile validation ');
    facade.ask();
    expect(requests).toEqual([
      { question: 'mobile validation', service: 'products', snapshotId: 'demo-v1' },
    ]);
    results.next(empty);
    expect(facade.answer()).toEqual(empty);
    expect(facade.loading()).toBe(false);
  });
  it('unsubscribes stale requests on service changes', () => {
    create();
    facade.setQuestion('mobile validation');
    facade.ask();
    expect(results.observed).toBe(true);
    facade.changeService('payments');
    expect(results.observed).toBe(false);
    results.next(empty);
    expect(facade.answer()).toBe(null);
    expect(facade.loading()).toBe(false);
  });
  it('cancels a pending answer when catalog is refreshed', () => {
    create();
    facade.setQuestion('mobile validation');
    facade.ask();
    facade.loadCatalog();
    expect(results.observed).toBe(false);
    expect(facade.answer()).toBe(null);
  });
  it('rejects a mismatched response scope', () => {
    create();
    facade.setQuestion('mobile validation');
    facade.ask();
    results.next({ ...empty, snapshotId: 'wrong' });
    expect(facade.answer()).toBe(null);
    expect(facade.error()).toContain('did not match');
  });
  it('presents stable problem codes and a trace reference without raw server details', () => {
    const fixture = create();
    facade.setQuestion('mobile validation');
    facade.ask();
    results.error(new KnowledgeError('snapshot_not_active', 'trace-456'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Refresh the connection. Request: trace-456',
    );
    expect(fixture.componentInstance.safeUrl('javascript:alert(1)')).toBe(null);
  });
});
