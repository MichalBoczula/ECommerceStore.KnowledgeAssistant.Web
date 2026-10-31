# E-Commerce Knowledge Assistant Web

Standalone Angular developer panel for sourced answers about validation, business
scenarios and API request contracts. The Python API owns retrieval and model calls.

## Run locally

Requires Node.js 24 and npm. Start the sibling Python API on port 8080, then:

```bash
npm ci
npm start
```

Open `http://localhost:4200`. The development proxy forwards `/api` to the API.
The synthetic demonstration corpus and evidence-only mode are labelled in the UI;
no answer is fabricated when the API fails. API keys never belong in Angular assets.

The panel offers service/snapshot context, numbered typed answer sections,
field-level validation rules, schema/example tabs, read-only expandable JSON,
copy, collapsible sections and source provenance. The JSON editor is loaded lazily.
Requests are cancelled when context changes; mismatched snapshot responses are rejected.

## Shared response schema

The API exports `contracts/answer.schema.json`. Copy a reviewed schema change into
this repository, then run:

```bash
npm run generate:contract
npm run check:contract
```

`src/app/api.generated.ts` is generated and must not be edited manually.
The frontend supports response schema version 1. `contracts/demo-answer.json` is a
synthetic response generated through the real Python API for contract/UI testing.

## Verify

```bash
npm test -- --watch=false
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests exercise API context, stale request cancellation, missing evidence,
response scope, upstream failures and unsafe source URLs. Browser checks exercise
validation/contract rendering, schema/raw JSON, tree expansion, provenance and
responsive layout using the reviewed synthetic response. They do not claim live
Azure retrieval. A real Python-to-Angular flow can be exercised through the local proxy.

## Host

```bash
docker build -t knowledge-assistant-web .
docker run --rm -p 4200:8080 \
  -e KNOWLEDGE_API_URL=http://YOUR-API-HOST:8080 \
  -e KNOWLEDGE_API_KEY=YOUR-SERVER-SIDE-KEY knowledge-assistant-web
```

Nginx serves the app and proxies `/api` while adding `X-API-Key` server-side. Use the
same key as `KA_API_KEY` on the backend. `/health/live` checks Nginx and
`/health/ready` checks the static application; neither proves upstream API health.
Infrastructure and runtime secrets belong to `ECommerceStore.Terraform`.

## Design

[Editable desktop and mobile Figma screens](https://www.figma.com/design/R3QdHpq0dCZnHqWv5JIQxD?node-id=5-5650)
use Material 3 components, Roboto and Roboto Mono. Source layout follows the approved
numbered validation/contract panel, with explicit demo and evidence-limit labels.
