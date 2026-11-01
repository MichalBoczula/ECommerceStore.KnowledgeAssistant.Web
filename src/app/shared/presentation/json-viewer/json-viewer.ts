import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import type { JsonEditor } from 'vanilla-jsoneditor';
@Component({
  selector: 'ka-json-viewer',
  template: `<div class="json-toolbar">
      <div>
        <button
          type="button"
          [disabled]="failed()"
          [attr.aria-pressed]="mode() === 'tree'"
          (click)="setMode('tree')"
        >
          Tree</button
        ><button type="button" [attr.aria-pressed]="mode() === 'raw'" (click)="setMode('raw')">
          JSON
        </button>
      </div>
      <div>
        <button type="button" (click)="expand()" [disabled]="mode() !== 'tree' || !ready()">
          Expand all</button
        ><button type="button" (click)="collapse()" [disabled]="mode() !== 'tree' || !ready()">
          Collapse all</button
        ><button type="button" (click)="copy()">Copy JSON</button>
      </div>
    </div>
    <div class="json-container" role="region" [attr.aria-label]="label">
      @if (!ready() && !failed() && mode() === 'tree') {
        <p class="viewer-notice" role="status">Loading JSON tree…</p>
      }
      @if (failed()) {
        <p class="viewer-notice">Interactive tree unavailable. Showing JSON text.</p>
      }
      <div #host [hidden]="mode() !== 'tree' || !ready() || failed()"></div>
      @if (mode() === 'raw' || failed()) {
        <pre><code>{{raw()}}</code></pre>
      }
    </div>
    <p class="copy-status" role="status">{{ status() }}</p>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .json-toolbar,
    .json-toolbar > div {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }
    .json-toolbar {
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .json-container {
      min-height: 80px;
      border: 1px solid var(--line);
      border-radius: 9px;
      overflow: auto;
      max-height: 520px;
      background: var(--surface-soft);
      --jse-theme-color: var(--accent);
      --jse-background-color: var(--surface-soft);
      --jse-font-family: Roboto Mono, monospace;
      --jse-font-size: 13px;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      margin: 0;
      padding: 16px;
      font-size: 13px;
    }
    .copy-status {
      font-size: 12px;
      color: var(--muted);
      min-height: 18px;
      margin: 5px 0 0;
    }
    button {
      font-size: 12px;
      padding: 6px 9px;
    }
    button[aria-pressed='true'] {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    .viewer-notice {
      color: var(--muted);
      font-size: 12px;
      padding: 8px 16px;
    }
  `,
})
export class JsonViewer implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  @Input() label = 'JSON document';
  @Input() set value(value: unknown) {
    this.content = value;
    this.raw.set(JSON.stringify(value, null, 2));
    this.editor?.updateProps({ content: { json: value } });
    this.status.set('');
  }
  private content: unknown;
  private editor?: JsonEditor;
  private destroyed = false;
  readonly raw = signal('');
  readonly mode = signal<'tree' | 'raw'>('tree');
  readonly status = signal('');
  readonly failed = signal(false);
  readonly ready = signal(false);
  async ngAfterViewInit() {
    try {
      const { createJSONEditor, Mode } = await import('vanilla-jsoneditor');
      if (this.destroyed) return;
      this.editor = createJSONEditor({
        target: this.host.nativeElement,
        props: {
          content: { json: this.content },
          readOnly: true,
          mode: Mode.tree,
          ariaLabel: this.label,
          mainMenuBar: false,
          navigationBar: true,
          statusBar: false,
          onRenderContextMenu: () => false,
        },
      });
      this.ready.set(true);
    } catch {
      this.failed.set(true);
      this.mode.set('raw');
    }
  }
  ngOnDestroy() {
    this.destroyed = true;
    void this.editor?.destroy();
  }
  setMode(mode: 'tree' | 'raw') {
    this.mode.set(mode);
  }
  expand() {
    this.editor?.expand([], () => true);
  }
  collapse() {
    this.editor?.collapse([], true);
  }
  async copy() {
    try {
      await navigator.clipboard.writeText(this.raw());
      this.status.set('JSON copied');
    } catch {
      this.mode.set('raw');
      this.status.set('Clipboard unavailable. Select and copy the JSON below.');
    }
  }
}
