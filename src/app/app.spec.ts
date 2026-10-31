import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
const catalog = {
  schemaVersion: 1,
  snapshots: [{ id: 'demo-v1', version: 'demo', isDemo: true, services: ['products', 'payments'] }],
  answerMode: 'evidence',
  retrievalMode: 'local_keyword',
};
describe('Knowledge Assistant', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true }));
  function create() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/catalog').flush(catalog);
    fixture.detectChanges();
    return fixture;
  }
  it('loads available context and labels demonstration data', () => {
    const fixture = create();
    expect(fixture.componentInstance.snapshotId()).toBe('demo-v1');
    expect(fixture.nativeElement.textContent).toContain('Demonstration dataset');
  });
  it('does not submit empty questions', () => {
    const fixture = create();
    fixture.componentInstance.ask();
    TestBed.inject(HttpTestingController).expectNone('/api/v1/query');
  });
  it('submits the selected snapshot and service', () => {
    const fixture = create();
    const app = fixture.componentInstance;
    app.useExample();
    app.ask();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/query');
    expect(request.request.body.snapshotId).toBe('demo-v1');
    expect(request.request.body.service).toBe('products');
    request.flush({
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
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No supporting documentation found');
  });
  it('cancels stale answers when the service changes', () => {
    const fixture = create();
    const app = fixture.componentInstance;
    app.useExample();
    app.ask();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/query');
    app.changeService('payments');
    expect(request.cancelled).toBe(true);
    expect(app.answer()).toBe(null);
    expect(app.loading()).toBe(false);
  });
  it('rejects an answer from a different snapshot', () => {
    const fixture = create();
    const app = fixture.componentInstance;
    app.useExample();
    app.ask();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/query')
      .flush({ schemaVersion: 1, snapshotId: 'wrong', service: 'products' });
    expect(app.answer()).toBe(null);
    expect(app.error()).toContain('did not match');
  });
  it('renders retrieval failures and rejects unsafe source links', () => {
    const fixture = create();
    const app = fixture.componentInstance;
    app.useExample();
    app.ask();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/query')
      .flush({ requestId: 'trace-id' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('trace-id');
    expect(app.safeUrl('javascript:alert(1)')).toBe(null);
  });
});
