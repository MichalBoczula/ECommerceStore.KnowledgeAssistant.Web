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
copy, collapsible sections and source provenance. Citations open and focus their source
card, with a return-to-answer action. Contract tabs support keyboard navigation and local
referenced schemas. Available JSON `null` examples are rendered using their origin metadata;
missing, invalid and unverified examples have distinct presentation states.
The JSON editor is loaded lazily and keeps a raw-text fallback.
Requests are cancelled when context changes; mismatched snapshot responses are rejected.

## Feature structure

This app follows `ecommerce-store-web` feature boundaries:

| Folder | Responsibility |
| --- | --- |
| `features/knowledge/domain/` | UI models, query model, repository port and stable errors. |
| `features/knowledge/application/` | Facade consumed by the page. |
| `features/knowledge/state/` | NgRx actions, feature reducer, effects and request cancellation. |
| `features/knowledge/infrastructure/` | Kiota repository and DTO/domain mappers. |
| `features/knowledge/presentation/` | Knowledge page and view-only interactions. |
| `shared/infrastructure/api-clients/knowledge/` | Committed Kiota-generated client. |
| `shared/presentation/` | Reusable read-only JSON viewer. |

The root component is a router outlet. The route composes feature providers and loads
the page lazily. The page calls its facade; effects use the repository port. Only the
infrastructure repository knows Kiota. Mappers isolate optional generated DTOs from
required UI models. API keys stay in the same-origin server proxy.
See [the architecture decision](docs/adr/0001-feature-layers-and-kiota.md).
The question page composes focused answer-panel, contract-viewer and source-citation
components. Their disclosure/tab/focus state remains in presentation; NgRx owns query
and context state. See [the answer panel guide](docs/answer-panel.md).

## OpenAPI and Kiota

The Python API owns `contracts/openapi.json`. This repository vendors the exact reviewed
artifact at `contracts/upstream/knowledge-assistant.openapi.json`; `source.json` pins
its API commit and SHA-256. The generated client includes catalog/query DTOs and
`application/problem+json` error mappings. The UI branches on problem `code` and shows
`traceId` for correlation; it never presents raw provider errors.

After an API contract change:

```bash
# In the API checkout:
uv run knowledge export-contract
# Commit and push the reviewed API change, then in this Web checkout:
node scripts/update-contract.mjs ../ECommerceStore.KnowledgeAssistant.Api/contracts/openapi.json API_COMMIT_SHA
npm run generate:clients
# Review mappers and tests; commit the artifact, manifest and generated client together.
npm run check:clients
```

Generation pins Kiota **1.37.0** and verifies the Linux x64 download checksum. Other
platforms set `KIOTA_BIN` to that version's executable. Run scripts in Bash (WSL/Git Bash
on Windows). Generated files are never edited manually. CI regenerates and rejects
changed or untracked generated files. Normal application builds use committed clients.

A deterministic, consumer-only compatibility view is created in `.tools/`: it inlines
Pydantic's all-JSON union, normalizes nullable scalar unions, and gives array section
variants a discriminated base for Kiota TypeScript parsing. The original OpenAPI file
remains byte-for-byte intact. Repository tests run the real generated serializers and
parsers, check all section kinds and JSON examples (objects, arrays, primitives and
null), and verify the resulting contract/schema values against the wire response.
This step is specific to the pinned generator and must be reviewed when it changes.

`contracts/demo-answer.json` is a synthetic answer from the real local API for UI tests.
The frontend supports response schema version 1.

## Verify

```bash
npm test -- --watch=false
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests exercise NgRx/facade context, stale request cancellation, response scope,
Problem Details codes, generated request serialization, generated response parsing,
JSON preservation, fetch abort and unsafe source URLs. Browser checks exercise
validation/contract rendering, schema/raw JSON, tree expansion, provenance and
responsive layout, null/missing examples, referenced schemas, keyboard/source focus,
partial/not-found answers, retry behavior and JSON copy using synthetic responses.
The browser artifact also contains desktop/mobile screenshots for visual review.
These tests do not claim live
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

## CI and Docker publication

CI follows the storefront Web and Users pattern: dependency review on pull requests,
repository-history secret scanning, source/build/contract checks, separate test jobs,
and a required quality gate. The image job builds once, smoke-tests and scans that
local image for fixable high/critical vulnerabilities, then publishes the same image
after a successful push to `main`. Pull requests build and scan without Docker Hub login
or publishing. Test results are uploaded as JUnit artifacts, including on failures.

Enable **Dependency graph** in this repository's **Settings → Advanced Security →
Supply chain security** before running the PR checks. GitHub dependency review requires
that setting; the quality gate fails if dependency review is unavailable or fails.

Configure these existing repository Actions secrets:

- `DOCKER_USER`: Docker Hub account with push access to `mb0101/ecommerce-store-knowledge-assistant-web`.
- `DOCKER_TOKEN`: that account's Docker Hub access token.

Successful main runs publish `mb0101/ecommerce-store-knowledge-assistant-web:<full-commit-sha>`
and `:latest`, verify both push digests match, and attach `image-reference.json` in the
`image-reference` workflow artifact. The artifact records the immutable
`docker.io/mb0101/ecommerce-store-knowledge-assistant-web@sha256:...` reference,
source commit and scanned image ID. Use the digest reference for deployment.

Add its `knowledge_web` entry to your existing Terraform `app_images` map, preserving
all other app entries. Run plan/apply from `ECommerceStore.Terraform` with its existing
Azure Storage backend and deployment variables. This application CI owns image
publication; Azure credentials, infrastructure deployment and state remain in that
Terraform checkout.

The Web image smoke test checks Nginx health, SPA fallback, favicon and built JavaScript. Query rendering is covered separately by desktop/mobile Playwright tests. The server proxy injects the API key at runtime; browser assets receive no API/model/Search credentials.

The same local CI entry points are available in `scripts/ci.sh`.
