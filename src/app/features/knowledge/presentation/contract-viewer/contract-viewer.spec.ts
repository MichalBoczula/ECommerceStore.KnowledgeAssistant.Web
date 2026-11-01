import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import demo from '../../../../../../contracts/demo-answer.json';
import { ContractSection } from '../../domain/model/answer';
import { JsonViewer } from '../../../../shared/presentation/json-viewer/json-viewer';
import { ContractViewer } from './contract-viewer';

@Component({ selector: 'ka-json-viewer', template: '<pre>{{ raw() }}</pre>' })
class JsonStub {
  @Input() value: unknown;
  @Input() label = '';
  raw() {
    return JSON.stringify(this.value);
  }
}
async function render(overrides: Partial<ContractSection> = {}) {
  TestBed.configureTestingModule({ imports: [ContractViewer] });
  TestBed.overrideComponent(ContractViewer, {
    remove: { imports: [JsonViewer] },
    add: { imports: [JsonStub] },
  });
  const fixture = TestBed.createComponent(ContractViewer);
  const section = {
    ...structuredClone(demo.sections.find((s) => s.type === 'api_contract')),
    ...overrides,
  } as ContractSection;
  fixture.componentRef.setInput('section', section);
  await fixture.whenStable();
  return { fixture, section, root: fixture.nativeElement as HTMLElement };
}
describe('Contract viewer', () => {
  it.each([null, false, 0, ''])(
    'renders an available JSON primitive %s without a truthiness check',
    async (value) => {
      const { root } = await render({ exampleRequest: value, exampleOrigin: 'openapi' });
      expect(
        root.querySelector('[role="tab"][data-tab="example"]')?.getAttribute('aria-selected'),
      ).toBe('true');
      expect(root.querySelector('pre')?.textContent).toBe(JSON.stringify(value));
      expect(root.textContent).not.toContain('No request example');
    },
  );
  it('starts on the schema when an example is unavailable', async () => {
    const { root } = await render({
      exampleRequest: null,
      exampleOrigin: 'unavailable',
      exampleSchemaValid: null,
    });
    expect((root.querySelector('[data-tab="example"]') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('[data-tab="schema"]')?.getAttribute('aria-selected')).toBe('true');
    expect(root.textContent).toContain('No request example is available');
  });
  it.each([
    { valid: null, label: 'Not verified' },
    { valid: false, label: 'Does not match the schema' },
    { valid: true, label: 'Schema checked' },
  ])('distinguishes verification state $valid', async ({ valid, label }) => {
    const { root } = await render({ exampleSchemaValid: valid });
    expect(root.querySelector('.verification')?.textContent).toBe(label);
  });
  it('labels generation without claiming that business validation passed', async () => {
    const { root } = await render({ exampleOrigin: 'generated' });
    expect(root.textContent).toContain('Generated example');
    expect(root.textContent).toContain(
      'Business validation and successful API execution are not confirmed',
    );
  });
  it('supports keyboard navigation and local schema definitions', async () => {
    const { root, fixture } = await render({ referenceSchemas: { Node: { type: 'object' } } });
    const example = root.querySelector('[data-tab="example"]') as HTMLButtonElement;
    example.focus();
    example.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-tab')).toBe('references');
    expect(JSON.parse(root.querySelector('pre')!.textContent!)).toEqual({
      components: { schemas: { Node: { type: 'object' } } },
    });
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-tab')).toBe('example');
  });
  it('skips an unavailable example in the tab sequence', async () => {
    const { root, fixture } = await render({
      exampleOrigin: 'unavailable',
      exampleRequest: null,
      referenceSchemas: { Node: {} },
    });
    const schema = root.querySelector('[data-tab="schema"]') as HTMLButtonElement;
    schema.focus();
    schema.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-tab')).toBe('references');
  });
  it('resets view state when a different contract arrives', async () => {
    const { fixture, section } = await render();
    fixture.componentInstance.select('schema');
    fixture.componentRef.setInput('section', { ...section, operationId: 'other' });
    await fixture.whenStable();
    expect(fixture.componentInstance.active()).toBe('example');
  });
});
