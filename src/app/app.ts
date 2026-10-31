import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import type { Answer } from './api.generated';
import { JsonViewer } from './json-viewer';
interface Snapshot {
  id: string;
  version: string;
  isDemo: boolean;
  services: string[];
}
interface Catalog {
  schemaVersion: 1;
  snapshots: Snapshot[];
  answerMode: string;
  retrievalMode: string;
}
@Component({
  selector: 'app-root',
  imports: [FormsModule, JsonViewer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private pending?: Subscription;
  private catalogRequest?: Subscription;
  readonly catalog = signal<Catalog | null>(null);
  readonly snapshotId = signal('');
  readonly service = signal('products');
  readonly question = signal('');
  readonly askedQuestion = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly answer = signal<Answer | null>(null);
  readonly expandedSource = signal<string | null>(null);
  readonly contractTabs = signal<Record<number, 'example' | 'schema'>>({});
  readonly currentSnapshot = computed(() =>
    this.catalog()?.snapshots.find((s) => s.id === this.snapshotId()),
  );
  readonly canAsk = computed(
    () =>
      this.question().trim().length >= 3 &&
      this.question().trim().length <= 4000 &&
      !!this.currentSnapshot() &&
      !this.loading(),
  );
  ngOnInit() {
    this.loadCatalog();
  }
  ngOnDestroy() {
    this.pending?.unsubscribe();
    this.catalogRequest?.unsubscribe();
  }
  loadCatalog() {
    this.catalogRequest?.unsubscribe();
    this.cancelAnswer();
    this.error.set('');
    this.catalog.set(null);
    this.catalogRequest = this.http.get<Catalog>('/api/v1/catalog').subscribe({
      next: (catalog) => {
        if (catalog.schemaVersion !== 1 || !catalog.snapshots?.length) {
          this.error.set('No supported documentation snapshot is available.');
          return;
        }
        this.catalog.set(catalog);
        this.snapshotId.set(catalog.snapshots[0].id);
        this.service.set(catalog.snapshots[0].services[0] ?? 'products');
      },
      error: () =>
        this.error.set('The knowledge API is unavailable. Check the connection and retry.'),
    });
  }
  changeService(value: string) {
    this.cancelAnswer();
    this.service.set(value);
  }
  changeSnapshot(value: string) {
    this.cancelAnswer();
    this.snapshotId.set(value);
    const services = this.currentSnapshot()?.services ?? [];
    if (!services.includes(this.service())) this.service.set(services[0] ?? 'products');
  }
  private cancelAnswer() {
    this.pending?.unsubscribe();
    this.loading.set(false);
    this.answer.set(null);
    this.expandedSource.set(null);
    this.contractTabs.set({});
  }
  ask() {
    if (!this.canAsk()) return;
    this.cancelAnswer();
    this.loading.set(true);
    this.error.set('');
    this.askedQuestion.set(this.question().trim());
    const request = {
      question: this.askedQuestion(),
      service: this.service(),
      snapshotId: this.snapshotId(),
    };
    this.pending = this.http.post<Answer>('/api/v1/query', request).subscribe({
      next: (answer) => {
        this.loading.set(false);
        if (
          answer.schemaVersion !== 1 ||
          answer.snapshotId !== request.snapshotId ||
          answer.service !== request.service
        ) {
          this.error.set('The response did not match the selected documentation snapshot.');
          return;
        }
        this.answer.set(answer);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          error.status === 409
            ? 'The active snapshot changed. Refresh the connection.'
            : 'Retrieval or answer verification failed. Please retry.' +
                (error.error?.requestId ? ' Request: ' + error.error.requestId : ''),
        );
      },
    });
  }
  useExample() {
    this.question.set(
      'How does mobile phone validation work? Give me the JSON contract for creating a mobile phone.',
    );
  }
  contractTab(index: number) {
    return this.contractTabs()[index] ?? 'example';
  }
  selectContract(index: number, value: 'example' | 'schema') {
    this.contractTabs.update((tabs) => ({ ...tabs, [index]: value }));
  }
  showSource(id: string) {
    this.expandedSource.set(id);
  }
  sourceNumber(id: string) {
    return (this.answer()?.sources.findIndex((s) => s.id === id) ?? -1) + 1;
  }
  sourceTitle(id: string) {
    return this.answer()?.sources.find((s) => s.id === id)?.title ?? 'Source unavailable';
  }
  serviceLabel(value: string) {
    return (
      (
        {
          products: 'Products',
          users: 'Users',
          invoices: 'Orders / Invoices',
          payments: 'Payments',
        } as Record<string, string>
      )[value] ?? value
    );
  }
  sectionLabel(value: string) {
    return (
      (
        {
          explanation: 'Explanation',
          validation: 'Validation rules',
          api_contract: 'API contract',
          scenario: 'Business scenario',
        } as Record<string, string>
      )[value] ?? value
    );
  }
  safeUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }
}
