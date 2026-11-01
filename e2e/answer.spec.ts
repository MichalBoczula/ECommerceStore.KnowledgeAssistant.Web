import { test, expect, Page } from '@playwright/test';
import demo from '../contracts/demo-answer.json';
import { Answer, ContractSection } from '../src/app/features/knowledge/domain/model/answer';

function sample(): Answer {
  return structuredClone(demo) as Answer;
}
function contract(answer: Answer): ContractSection {
  return answer.sections.find((s) => s.type === 'api_contract') as ContractSection;
}
async function prepare(page: Page, answer: Answer) {
  let calls = 0;
  await page.route('**/api/v1/catalog', (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        snapshots: [
          { id: 'demo-v1', version: 'demo', isDemo: true, services: ['products', 'payments'] },
        ],
        answerMode: answer.answerMode,
        retrievalMode: answer.retrievalMode,
      },
    }),
  );
  await page.route('**/api/v1/query', (route) => {
    calls++;
    return route.fulfill({ json: answer });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the mobile phone example' }).click();
  return () => calls;
}
async function ask(page: Page) {
  await page.getByRole('button', { name: 'Ask Knowledge Assistant', exact: true }).click();
  await expect(page.locator('ka-answer-panel')).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

test('renders numbered rules, JSON controls and source navigation', async ({ page }, testInfo) => {
  const wire = sample();
  const count = await prepare(page, wire);
  await ask(page);
  await expect(page.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Create a mobile phone', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.section-number')).toHaveText(['1', '2']);
  await page.getByRole('tab', { name: 'Request schema', exact: true }).click();
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await expect(page.locator('ka-json-viewer pre')).toContainText('required');
  await page.getByRole('tab', { name: 'Example request', exact: true }).click();
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  await expect(page.locator('ka-json-viewer')).toContainText('storageGb');
  await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  const citation = page.locator('.citations button').first();
  await citation.click();
  await expect(page.locator('.source-panel')).toHaveAttribute('open', '');
  await expect(page.locator('article.selected')).toBeFocused();
  await page.getByRole('button', { name: 'Back to cited answer' }).click();
  await expect(citation).toBeFocused();
  await page.locator('.source-panel > summary').click();
  await page.getByRole('button', { name: 'Collapse sections', exact: true }).click();
  await expect(page.locator('.answer-section[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand sections', exact: true }).click();
  await expect(page.locator('.answer-section[open]')).toHaveCount(2);
  await noOverflow(page);
  expect(count()).toBe(1);
  await page
    .locator('ka-answer-panel')
    .screenshot({ path: testInfo.outputPath('answer-panel.png') });
});

test('renders a documented JSON null example as available', async ({ page }) => {
  const wire = sample();
  Object.assign(contract(wire), {
    requestSchema: { type: ['object', 'null'] },
    exampleRequest: null,
    exampleOrigin: 'openapi',
    exampleSchemaValid: true,
  });
  await prepare(page, wire);
  await ask(page);
  await expect(page.getByRole('tab', { name: 'Example request' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await expect(page.locator('ka-json-viewer pre')).toHaveText('null');
  await expect(page.locator('.verification')).toHaveText('Schema checked');
  await expect(page.locator('.contract-notice')).toHaveCount(0);
});

test('shows the original schema and local references when no example exists', async ({ page }) => {
  const wire = sample();
  Object.assign(contract(wire), {
    exampleRequest: null,
    exampleOrigin: 'unavailable',
    exampleSchemaValid: null,
    requestSchema: { $ref: '#/components/schemas/Node' },
    referenceSchemas: {
      Node: { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } },
    },
  });
  await prepare(page, wire);
  await ask(page);
  await expect(page.getByRole('tab', { name: 'Example request' })).toBeDisabled();
  const schema = page.getByRole('tab', { name: 'Request schema' });
  await expect(schema).toHaveAttribute('aria-selected', 'true');
  await schema.focus();
  await schema.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Referenced schemas' })).toBeFocused();
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await expect(page.locator('ka-json-viewer pre')).toContainText('components');
  await expect(page.locator('ka-json-viewer pre')).toContainText('Node');
  await page.getByRole('tab', { name: 'Referenced schemas' }).press('Home');
  await expect(schema).toBeFocused();
  await noOverflow(page);
});

test('distinguishes generated examples, partial answers and evidence limits', async ({ page }) => {
  const wire = sample();
  wire.status = 'partial';
  wire.answerMode = 'model';
  wire.limitations = [
    'The selected policy has no explicit operation link; runtime enforcement was not established.',
  ];
  contract(wire).exampleOrigin = 'generated';
  await prepare(page, wire);
  await ask(page);
  await expect(page.locator('.partial-notice')).toContainText('Some requested information');
  await expect(page.locator('.origin')).toHaveText('Generated example');
  await expect(page.locator('.contract-note')).toContainText(
    'Business validation and successful API execution are not confirmed',
  );
  await expect(page.locator('.limitations')).toContainText('runtime enforcement');
  await expect(page.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
});

test('shows unknown verification as unknown, not failed', async ({ page }) => {
  const wire = sample();
  wire.status = 'partial';
  contract(wire).exampleSchemaValid = null;
  await prepare(page, wire);
  await ask(page);
  await expect(page.locator('.verification')).toHaveText('Not verified');
  await expect(page.locator('.verification')).not.toHaveClass(/failed/);
});

test('keeps long schemas and source hashes inside the mobile viewport', async ({ page }) => {
  const wire = sample();
  const section = contract(wire);
  section.path = '/mobile-phones/' + 'very-long-path'.repeat(15);
  section.operationId = 'CreateMobilePhoneWith'.repeat(15);
  section.requestSchema = {
    type: 'object',
    properties: { ['long-property'.repeat(12)]: { description: 'long-value'.repeat(40) } },
  };
  await prepare(page, wire);
  await ask(page);
  await page.getByRole('tab', { name: 'Request schema' }).click();
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await page.locator('.citations button').first().click();
  await noOverflow(page);
});

test('not-found state does not pretend that a contract exists', async ({ page }) => {
  const wire = sample();
  Object.assign(wire, {
    status: 'not_found',
    sections: [],
    sources: [],
    limitations: ['No supporting evidence was returned.'],
  });
  await prepare(page, wire);
  await ask(page);
  await expect(
    page.getByRole('heading', { name: 'No supporting documentation found' }),
  ).toBeVisible();
  await expect(page.locator('ka-contract-viewer')).toHaveCount(0);
  await expect(page.locator('.source-panel')).toHaveCount(0);
});

test('contract tabs are independent when two operations are returned', async ({ page }) => {
  const wire = sample();
  const second = structuredClone(contract(wire));
  second.title = 'Update a mobile phone';
  second.method = 'PUT';
  second.operationId = 'updateMobilePhone';
  wire.sections.push(second);
  await prepare(page, wire);
  await ask(page);
  const viewers = page.locator('ka-contract-viewer');
  await viewers.nth(0).getByRole('tab', { name: 'Request schema' }).click();
  await expect(viewers.nth(0).getByRole('tab', { name: 'Request schema' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(viewers.nth(1).getByRole('tab', { name: 'Example request' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const ids = await page
    .locator('[role="tab"], [role="tabpanel"]')
    .evaluateAll((items) => items.map((item) => item.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test('plain answer text is not rendered as executable HTML', async ({ page }) => {
  const wire = sample();
  wire.sections.push({
    type: 'explanation',
    title: 'Source text',
    content: '<img src=x onerror=alert(1)>',
    sourceIds: [wire.sources[0].id],
  });
  await prepare(page, wire);
  await ask(page);
  await expect(page.locator('.prose')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('ka-answer-panel img')).toHaveCount(0);
});

test('problem details are safe and retry only runs after a user action', async ({ page }) => {
  const wire = sample();
  await prepare(page, wire);
  let calls = 0;
  await page.route('**/api/v1/query', (route) => {
    calls++;
    return calls === 1
      ? route.fulfill({
          status: 503,
          contentType: 'application/problem+json',
          json: {
            type: 'about:blank',
            title: 'Service Unavailable',
            status: 503,
            detail: 'provider-private-value',
            instance: '/api/v1/query',
            code: 'answer_verification_failed',
            traceId: 'browser-trace',
            errors: [],
            missingProperties: [],
          },
        })
      : route.fulfill({ json: wire });
  });
  await page.getByRole('button', { name: 'Ask Knowledge Assistant', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('browser-trace');
  await expect(page.getByRole('alert')).not.toContainText('provider-private-value');
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'Try question again' }).click();
  await expect(page.locator('ka-answer-panel')).toBeVisible();
  expect(calls).toBe(2);
});

test('copies JSON without making another API call', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const wire = sample();
  const count = await prepare(page, wire);
  await ask(page);
  await page.getByRole('button', { name: 'Copy JSON', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'JSON copied' })).toBeVisible();
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(
    contract(wire).exampleRequest,
  );
  expect(count()).toBe(1);
});
