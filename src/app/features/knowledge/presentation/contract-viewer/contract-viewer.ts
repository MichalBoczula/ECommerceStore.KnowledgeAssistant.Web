import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { ContractSection } from '../../domain/model/answer';
import { JsonViewer } from '../../../../shared/presentation/json-viewer/json-viewer';

type ContractTab = 'example' | 'schema' | 'references';
let nextContract = 0;

@Component({
  selector: 'ka-contract-viewer',
  imports: [JsonViewer],
  templateUrl: './contract-viewer.html',
  styleUrl: './contract-viewer.scss',
})
export class ContractViewer implements OnChanges {
  @Input({ required: true }) section!: ContractSection;
  @ViewChildren('tabButton') private buttons!: QueryList<ElementRef<HTMLButtonElement>>;
  readonly id = `contract-${++nextContract}`;
  readonly active = signal<ContractTab>('example');
  references: unknown = {};

  ngOnChanges() {
    this.active.set(this.hasExample() ? 'example' : 'schema');
    this.references = { components: { schemas: this.section.referenceSchemas } };
  }
  hasExample() {
    return this.section.exampleOrigin !== 'unavailable';
  }
  hasRequestBody() {
    return !!this.section.mediaType || Object.keys(this.section.requestSchema).length > 0;
  }
  hasReferences() {
    return Object.keys(this.section.referenceSchemas).length > 0;
  }
  tabs(): ContractTab[] {
    return [
      ...(this.hasExample() ? ['example' as const] : []),
      'schema',
      ...(this.hasReferences() ? ['references' as const] : []),
    ];
  }
  select(tab: ContractTab) {
    this.active.set(tab);
  }
  keydown(event: KeyboardEvent) {
    const tabs = this.tabs();
    let index = tabs.indexOf(this.active());
    switch (event.key) {
      case 'ArrowRight':
        index = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        index = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        index = 0;
        break;
      case 'End':
        index = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.active.set(tabs[index]);
    this.buttons
      .find((button) => button.nativeElement.dataset['tab'] === tabs[index])
      ?.nativeElement.focus();
  }
  validationLabel() {
    return this.section.exampleSchemaValid === true
      ? 'Schema checked'
      : this.section.exampleSchemaValid === false
        ? 'Does not match the schema'
        : 'Not verified';
  }
}
