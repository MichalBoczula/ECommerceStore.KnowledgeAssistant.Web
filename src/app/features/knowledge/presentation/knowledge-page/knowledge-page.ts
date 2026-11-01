import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KnowledgeFacade } from '../../application/knowledge.facade';
import { JsonViewer } from '../../../../shared/presentation/json-viewer/json-viewer';

@Component({
  selector: 'ka-knowledge-page',
  imports: [FormsModule, JsonViewer],
  templateUrl: './knowledge-page.html',
  styleUrl: './knowledge-page.scss',
})
export class KnowledgePage implements OnInit {
  readonly facade = inject(KnowledgeFacade);
  readonly catalog = this.facade.catalog;
  readonly snapshotId = this.facade.snapshotId;
  readonly service = this.facade.service;
  readonly question = this.facade.question;
  readonly askedQuestion = this.facade.askedQuestion;
  readonly loading = this.facade.loading;
  readonly error = this.facade.error;
  readonly answer = this.facade.answer;
  readonly currentSnapshot = this.facade.currentSnapshot;
  readonly canAsk = this.facade.canAsk;
  readonly expandedSource = signal<string | null>(null);
  readonly contractTabs = signal<Record<number, 'example' | 'schema'>>({});
  ngOnInit() {
    this.loadCatalog();
  }
  private resetView() {
    this.expandedSource.set(null);
    this.contractTabs.set({});
  }
  loadCatalog() {
    this.resetView();
    this.facade.loadCatalog();
  }
  changeService(value: string) {
    this.resetView();
    this.facade.changeService(value);
  }
  changeSnapshot(value: string) {
    this.resetView();
    this.facade.changeSnapshot(value);
  }
  ask() {
    if (this.canAsk()) {
      this.resetView();
      this.facade.ask();
    }
  }
  useExample() {
    this.facade.setQuestion(
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
