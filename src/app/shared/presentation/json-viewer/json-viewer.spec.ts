import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { JsonViewer } from './json-viewer';

const mock = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('vanilla-jsoneditor', () => ({ createJSONEditor: mock.create, Mode: { tree: 'tree' } }));
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
afterEach(() => {
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else Reflect.deleteProperty(navigator, 'clipboard');
});
beforeEach(() => {
  mock.create.mockReset();
  mock.create.mockReturnValue({
    updateProps: vi.fn(),
    expand: vi.fn(),
    collapse: vi.fn(),
    destroy: vi.fn(),
  });
});
async function render(value: unknown) {
  TestBed.configureTestingModule({ imports: [JsonViewer] });
  const fixture = TestBed.createComponent(JsonViewer);
  fixture.componentRef.setInput('value', value);
  await fixture.whenStable();
  await vi.waitFor(() => expect(mock.create).toHaveBeenCalled());
  await fixture.whenStable();
  return fixture;
}
it('copies a literal JSON null rather than treating it as unavailable', async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: write },
  });
  const fixture = await render(null);
  await fixture.componentInstance.copy();
  expect(write).toHaveBeenCalledWith('null');
  expect(fixture.componentInstance.status()).toBe('JSON copied');
});
it('falls back to selectable JSON text when clipboard access is unavailable', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn().mockRejectedValue(new Error('unavailable')),
    },
  });
  const fixture = await render({ phone: { storage: 256 } });
  await fixture.componentInstance.copy();
  await fixture.whenStable();
  expect(fixture.componentInstance.mode()).toBe('raw');
  expect(fixture.nativeElement.querySelector('pre').textContent).toContain('storage');
  expect(fixture.componentInstance.status()).toContain('Select and copy');
});
it('preserves raw JSON when the interactive tree cannot be initialized', async () => {
  mock.create.mockImplementation(() => {
    throw new Error('tree unavailable');
  });
  const fixture = await render(false);
  expect(fixture.componentInstance.mode()).toBe('raw');
  expect(fixture.nativeElement.querySelector('pre').textContent).toBe('false');
  const tree = [...fixture.nativeElement.querySelectorAll('button')].find(
    (b: unknown) => (b as HTMLButtonElement).textContent?.trim() === 'Tree',
  ) as HTMLButtonElement;
  expect(tree.disabled).toBe(true);
});
it('destroys the editor when its answer or contract view is removed', async () => {
  const fixture = await render({ name: 'Phone' });
  const editor = mock.create.mock.results[0].value;
  fixture.destroy();
  expect(editor.destroy).toHaveBeenCalledOnce();
});
