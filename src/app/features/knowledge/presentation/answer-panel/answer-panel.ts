import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Answer, Section } from '../../domain/model/answer';
import { ContractViewer } from '../contract-viewer/contract-viewer';
import { CitationSelection, SourceCitations } from '../source-citations/source-citations';

let nextPanel = 0;

export function liveDocsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'ka-answer-panel',
  imports: [ContractViewer, SourceCitations],
  templateUrl: './answer-panel.html',
  styleUrl: './answer-panel.scss',
})
export class AnswerPanel implements OnChanges {
  @Input({ required: true }) answer!: Answer;
  @Input() question = '';
  @ViewChild('sourcePanel') private sourcePanel?: ElementRef<HTMLDetailsElement>;
  @ViewChildren('sourceCard') private cards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('answerSection') private sections!: QueryList<ElementRef<HTMLDetailsElement>>;
  readonly id = `answer-${++nextPanel}`;
  readonly selectedSource = signal<string | null>(null);
  readonly liveDocsUrl = liveDocsUrl;
  private citationTrigger?: HTMLElement;

  ngOnChanges() {
    this.selectedSource.set(null);
    this.citationTrigger = undefined;
    if (this.sourcePanel) this.sourcePanel.nativeElement.open = false;
    this.setSectionsOpen(true);
  }
  setSectionsOpen(open: boolean) {
    this.sections?.forEach((section) => (section.nativeElement.open = open));
  }
  showSource(selection: CitationSelection) {
    const card = this.cards.find(
      (item) => item.nativeElement.dataset['sourceId'] === selection.id,
    )?.nativeElement;
    if (!card || !this.sourcePanel) return;
    this.citationTrigger = selection.trigger;
    this.sourcePanel.nativeElement.open = true;
    this.selectedSource.set(selection.id);
    card.focus({ preventScroll: true });
    card.scrollIntoView?.({ block: 'start' });
  }
  returnToCitation() {
    if (this.citationTrigger?.isConnected) {
      this.citationTrigger.focus({ preventScroll: true });
      this.citationTrigger.scrollIntoView?.({ block: 'center' });
    }
  }
  statusLabel() {
    return this.answer.status === 'answered'
      ? 'Answer ready'
      : this.answer.status === 'partial'
        ? 'Partial answer'
        : 'No matching evidence';
  }
  sectionLabel(section: Section) {
    if (section.type === 'scenario')
      return section.executionStatus ? 'Observed execution' : 'Expected behavior';
    return {
      explanation: 'Explanation',
      validation: 'Validation rules',
      api_contract: 'API contract',
    }[section.type];
  }
}
