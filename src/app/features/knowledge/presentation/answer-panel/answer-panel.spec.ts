import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import demo from '../../../../../../contracts/demo-answer.json';
import { Answer, ContractSection } from '../../domain/model/answer';
import { ContractViewer } from '../contract-viewer/contract-viewer';
import { AnswerPanel, liveDocsUrl } from './answer-panel';

@Component({ selector: 'ka-contract-viewer', template: '<code>{{ section.path }}</code>' })
class ContractStub {
  @Input() section!: ContractSection;
}
async function render(override: Partial<Answer> = {}) {
  TestBed.configureTestingModule({ imports: [AnswerPanel] });
  TestBed.overrideComponent(AnswerPanel, {
    remove: { imports: [ContractViewer] },
    add: { imports: [ContractStub] },
  });
  const fixture = TestBed.createComponent(AnswerPanel);
  fixture.componentRef.setInput('answer', { ...structuredClone(demo), ...override } as Answer);
  fixture.componentRef.setInput('question', 'Explain mobile phone validation');
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}
describe('Answer panel', () => {
  it('opens and focuses the cited source, then returns focus to the citation', async () => {
    const { fixture, root } = await render();
    const citation = root.querySelector('ka-source-citations button') as HTMLButtonElement;
    citation.click();
    await fixture.whenStable();
    const panel = root.querySelector('.source-panel') as HTMLDetailsElement;
    const selected = root.querySelector('article.selected');
    expect(panel.open).toBe(true);
    expect(document.activeElement).toBe(selected);
    (root.querySelector('.return-to-answer') as HTMLButtonElement).click();
    expect(document.activeElement).toBe(citation);
    panel.open = false;
    citation.click();
    expect(panel.open).toBe(true);
  });
  it('opens and closes answer sections without changing answer content', async () => {
    const { root } = await render();
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.answer-tools button')];
    buttons.find((b) => b.textContent?.includes('Collapse'))!.click();
    expect(
      [...root.querySelectorAll<HTMLDetailsElement>('.answer-section')].every((d) => !d.open),
    ).toBe(true);
    buttons.find((b) => b.textContent?.includes('Expand'))!.click();
    expect(
      [...root.querySelectorAll<HTMLDetailsElement>('.answer-section')].every((d) => d.open),
    ).toBe(true);
  });
  it('shows partial evidence and limitations alongside supported sections', async () => {
    const { root } = await render({
      status: 'partial',
      limitations: ['No operation link established.'],
    });
    expect(root.querySelector('.partial-notice')?.textContent).toContain(
      'Some requested information',
    );
    expect(root.querySelector('.limitations')?.textContent).toContain('No operation link');
    expect(root.querySelectorAll('.answer-section').length).toBe(2);
  });
  it('renders a useful not-found state without empty source controls', async () => {
    const { root } = await render({ status: 'not_found', sections: [], sources: [] });
    expect(root.querySelector('.empty-answer')?.textContent).toContain(
      'No supporting documentation',
    );
    expect(root.querySelector('.source-panel')).toBe(null);
  });
  it('renders model and source text as text, not HTML', async () => {
    const { root } = await render({
      sections: [
        {
          type: 'explanation',
          title: 'Source text',
          content: '<img src=x onerror=alert(1)>',
          sourceIds: [demo.sources[0].id],
        },
      ],
    });
    expect(root.querySelector('.prose')?.textContent).toContain('<img');
    expect(root.querySelector('img')).toBe(null);
  });
  it('distinguishes expected behavior from an observed failed run', async () => {
    const { root } = await render({
      sections: [
        {
          type: 'scenario',
          title: 'Expected',
          content: 'Then reject',
          executionStatus: null,
          sourceIds: [],
        },
        {
          type: 'scenario',
          title: 'Observed',
          content: 'Failed step',
          executionStatus: 'failed',
          sourceIds: [],
        },
      ],
    });
    expect(root.textContent).toContain('Expected business behavior');
    expect(root.textContent).toContain('Observed run: failed');
  });
  it('clears source/disclosure state when another answer arrives', async () => {
    const { root, fixture } = await render();
    (root.querySelector('ka-source-citations button') as HTMLButtonElement).click();
    fixture.componentInstance.setSectionsOpen(false);
    fixture.componentRef.setInput('answer', { ...structuredClone(demo), requestId: 'new-answer' });
    await fixture.whenStable();
    expect(fixture.componentInstance.selectedSource()).toBe(null);
    expect((root.querySelector('.source-panel') as HTMLDetailsElement).open).toBe(false);
    expect(
      [...root.querySelectorAll<HTMLDetailsElement>('.answer-section')].every((d) => d.open),
    ).toBe(true);
  });
  it('does not invent a source number for a missing citation', async () => {
    const { root } = await render({
      sections: [
        { type: 'explanation', title: 'Unknown', content: 'Source absent', sourceIds: ['missing'] },
      ],
    });
    expect(root.textContent).toContain('Source unavailable');
    expect(root.querySelector('ka-source-citations button')).toBe(null);
  });
});
describe('LiveDocs links', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '/relative',
    'file:///tmp/example',
    'https://user:password@example.test',
    null,
  ])('rejects unsafe or unavailable URL %s', (value) => {
    expect(liveDocsUrl(value)).toBe(null);
  });
  it('preserves an absolute HTTP(S) documentation URL', () => {
    expect(liveDocsUrl('https://docs.example.test/livedoc/v1/openapi.json')).toBe(
      'https://docs.example.test/livedoc/v1/openapi.json',
    );
  });
});
