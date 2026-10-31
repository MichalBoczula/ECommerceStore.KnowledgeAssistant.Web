import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import demo from '../../../../../../contracts/demo-answer.json';
import { KNOWLEDGE_API_BASE_URL } from '../../../../shared/infrastructure/knowledge-request-adapter';
import { KnowledgeKiotaRepository } from './knowledge-kiota-repository';

const request = {
  question: 'mobile phone validation',
  service: 'products' as const,
  snapshotId: 'demo-v1',
};
function setup(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json',
        },
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  TestBed.configureTestingModule({
    providers: [
      KnowledgeKiotaRepository,
      { provide: KNOWLEDGE_API_BASE_URL, useValue: 'http://localhost' },
    ],
  });
  return { repository: TestBed.inject(KnowledgeKiotaRepository), fetchMock };
}
afterEach(() => vi.unstubAllGlobals());
describe('Knowledge Kiota repository', () => {
  it('uses generated request serialization and maps the full contract without metadata', async () => {
    const { repository, fetchMock } = setup(demo);
    const answer = await firstValueFrom(repository.query(request));
    expect(answer).toEqual(demo);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost/api/v1/query');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(await new Response(init.body).text())).toEqual(request);
    expect(init.credentials).toBe('same-origin');
    expect(new Headers(init.headers).has('X-API-Key')).toBe(false);
  });
  it.each(
    [
      null,
      false,
      0,
      'text',
      [1, false, null, { a: ['b'] }],
      { additionalData: { preserved: true }, nested: { n: null, list: [0, 'x'] } },
    ].map((value) => ({ value })),
  )('preserves arbitrary JSON example value $value', async ({ value: example }) => {
    const wire = structuredClone(demo);
    const contract = wire.sections.find((s) => s.type === 'api_contract')!;
    Object.assign(contract, { exampleRequest: example });
    const { repository } = setup(wire);
    const answer = await firstValueFrom(repository.query(request));
    const mapped = answer.sections.find((s) => s.type === 'api_contract');
    expect(mapped?.type === 'api_contract' && mapped.exampleRequest).toEqual(example);
  });
  it('parses explanation and scenario variants through the generated discriminator', async () => {
    const wire = {
      ...demo,
      sections: [
        {
          type: 'explanation',
          title: 'Expected behavior',
          content: 'Documented rule',
          sourceIds: ['s1'],
        },
        {
          type: 'scenario',
          title: 'Observed execution',
          content: 'Given a phone',
          executionStatus: 'passed',
          sourceIds: ['s1'],
        },
        {
          type: 'scenario',
          title: 'Unexecuted scenario',
          content: 'Given another phone',
          executionStatus: null,
          sourceIds: ['s1'],
        },
      ],
    };
    const { repository } = setup(wire);
    expect((await firstValueFrom(repository.query(request))).sections).toEqual(wire.sections);
  });
  it('maps generated problem+json errors by code and traceId', async () => {
    const { repository } = setup(
      {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'safe',
        instance: '/api/v1/query',
        code: 'snapshot_not_active',
        traceId: 'trace-123',
        errors: [],
        missingProperties: [],
      },
      409,
    );
    await expect(firstValueFrom(repository.query(request))).rejects.toMatchObject({
      code: 'snapshot_not_active',
      traceId: 'trace-123',
    });
  });
  it('aborts the underlying fetch when the subscription is cancelled', async () => {
    const { repository, fetchMock } = setup(demo);
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const pending = repository.query(request).subscribe();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const signal = (fetchMock.mock.calls[0][1] as RequestInit).signal!;
    pending.unsubscribe();
    expect(signal.aborted).toBe(true);
  });
  it('rejects unsupported response versions', async () => {
    const { repository } = setup({ ...demo, schemaVersion: 2 });
    await expect(firstValueFrom(repository.query(request))).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
});
