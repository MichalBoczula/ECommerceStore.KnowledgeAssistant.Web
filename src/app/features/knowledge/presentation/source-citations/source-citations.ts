import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Source } from '../../domain/model/answer';

export interface CitationSelection {
  id: string;
  trigger: HTMLElement;
}

@Component({
  selector: 'ka-source-citations',
  template: `<div class="citations" [class.compact]="compact">
    @if (!compact) {
      <span class="label">Supporting documentation</span>
    }
    @for (id of uniqueIds(); track id) {
      @if (reference(id); as ref) {
        <button
          type="button"
          [attr.aria-controls]="targetPrefix + (ref.number - 1)"
          [attr.aria-label]="'Open source ' + ref.number + ': ' + ref.source.title"
          (click)="select(id, $event)"
        >
          [{{ ref.number }}] {{ compact ? 'Source' : ref.source.title }}
        </button>
      } @else {
        <span class="missing">Source unavailable</span>
      }
    }
  </div>`,
  styles: `
    :host {
      display: block;
    }
    .citations {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      align-items: baseline;
      margin-top: 18px;
    }
    .compact {
      margin-top: 4px;
      gap: 5px;
    }
    .label,
    .missing {
      font-size: 11px;
      color: var(--muted);
    }
    button {
      border: 0;
      padding: 3px 0;
      background: transparent;
      color: var(--accent);
      font-size: 12px;
      text-align: left;
      overflow-wrap: anywhere;
    }
    button:hover {
      text-decoration: underline;
    }
  `,
})
export class SourceCitations {
  @Input() ids: string[] = [];
  @Input() sources: Source[] = [];
  @Input() compact = false;
  @Input() targetPrefix = '';
  @Output() selected = new EventEmitter<CitationSelection>();
  uniqueIds() {
    return [...new Set(this.ids)];
  }
  reference(id: string) {
    const index = this.sources.findIndex((source) => source.id === id);
    return index < 0 ? null : { source: this.sources[index], number: index + 1 };
  }
  select(id: string, event: Event) {
    this.selected.emit({ id, trigger: event.currentTarget as HTMLElement });
  }
}
