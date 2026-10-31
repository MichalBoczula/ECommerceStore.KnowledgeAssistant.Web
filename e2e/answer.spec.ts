import { test, expect } from '@playwright/test';
import answer from '../contracts/demo-answer.json';
test('renders sourced validation and an expandable JSON contract', async ({ page }) => {
  await page.route('**/api/v1/catalog', (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        snapshots: [{ id: 'demo-v1', version: 'demo', isDemo: true, services: ['products'] }],
        answerMode: 'evidence',
        retrievalMode: 'local_keyword',
      },
    }),
  );
  await page.route('**/api/v1/query', (route) => route.fulfill({ json: answer }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the mobile phone example' }).click();
  await page.getByRole('button', { name: 'Ask Knowledge Assistant', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Create a mobile phone', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Request schema', exact: true }).click();
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  await expect(page.locator('ka-json-viewer pre')).toContainText('required');
  await page.getByRole('button', { name: 'Example request', exact: true }).click();
  await page.getByRole('button', { name: 'Tree', exact: true }).click();
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  await expect(page.locator('ka-json-viewer')).toContainText('storageGb');
  await page
    .getByRole('button', { name: /\[1\] Source/ })
    .first()
    .click();
  await expect(page.locator('.source-panel')).toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
