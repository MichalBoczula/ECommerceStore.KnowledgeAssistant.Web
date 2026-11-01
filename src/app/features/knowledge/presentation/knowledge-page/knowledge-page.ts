import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KnowledgeFacade } from '../../application/knowledge.facade';
import { AnswerPanel } from '../answer-panel/answer-panel';

@Component({
  selector: 'ka-knowledge-page',
  imports: [FormsModule, AnswerPanel],
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
  ngOnInit() {
    this.loadCatalog();
  }
  loadCatalog() {
    this.facade.loadCatalog();
  }
  changeService(value: string) {
    this.facade.changeService(value);
  }
  changeSnapshot(value: string) {
    this.facade.changeSnapshot(value);
  }
  ask() {
    this.facade.ask();
  }
  useExample() {
    const examples: Record<string, string> = {
      products:
        'How does mobile phone validation work? Give me the JSON contract for creating a mobile phone.',
      users: 'Explain customer validation and show me the create customer request contract.',
      invoices: 'When can an invoice PDF be downloaded?',
      payments: 'How does checkout handle a provider timeout?',
    };
    this.facade.setQuestion(examples[this.service()] ?? examples['products']);
  }
  exampleLabel() {
    return (
      (
        {
          products: 'mobile phone',
          users: 'customer',
          invoices: 'invoice',
          payments: 'checkout',
        } as Record<string, string>
      )[this.service()] ?? 'documentation'
    );
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
}
