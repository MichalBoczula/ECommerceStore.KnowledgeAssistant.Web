# Structured answer panel

The question page keeps the existing facade → NgRx → repository port → Kiota flow.
This change adds no handwritten HTTP client, backend contract, dependency or credential
to browser assets. The vendored OpenAPI remains identical to the reviewed backend
contract, and Kiota regeneration remains a required CI check.

## Presentation responsibilities

| Component | Responsibility |
| --- | --- |
| Knowledge page | Service/snapshot selection, question submission, loading/error/starting states. |
| Answer panel | Numbered typed sections, partial/not-found states, limits and source navigation. |
| Contract viewer | Operation metadata; example, request schema and local reference tabs. |
| Source citations | Known source numbers/titles and an event to open the corresponding source card. |
| Shared JSON viewer | Read-only tree/text, expand/collapse, copy and raw-text fallback. |

Answer section order is preserved from the API. Validation, contracts, explanations
and expected/observed scenarios remain distinct. Expand/collapse affects presentation
only. Changing query context clears the answer through the existing NgRx flow and
destroys its viewers. No interaction with tabs, citations or copy sends another query.
The repository disables Kiota's automatic retries for query POSTs so a failed query
does not silently repeat model work. The page offers an explicit retry action;
catalog GET requests keep the existing transport behavior.

## Contract metadata

Example availability follows `exampleOrigin`, rather than testing the JSON value for
truthiness. Documented/generated null, false, zero and empty strings remain available
JSON values. An unavailable example starts on the original request schema and disables
the unavailable example tab. An operation with no documented request body is labelled
accordingly rather than inventing a payload.

`exampleSchemaValid` has three presentations: **Schema checked**, **Does not match the
schema**, and **Not verified**. Invalid documented examples remain visible with their
metadata. Generated examples carry the API's distinction between schema checking and
runtime/business validation; the UI does not label a generated request as executed.

When `referenceSchemas` contains definitions, a third tab presents them under the
`components.schemas` root used by local OpenAPI references. The request-schema tab
continues to display the exact returned schema. The UI does not resolve remote `$ref`
URLs or replace the source schema.

Contract tabs use a tablist, associated tabpanels, roving tab stops and Left/Right/
Home/End keys. Disabled example tabs are skipped. Each contract has independent view
state and unique control/panel IDs.

## Evidence and sources

Partial answers retain supported sections and expose an evidence/limits notice.
Not-found answers provide a specific-operation/context hint without fabricated
contracts or empty source controls. Demo, answer mode and retrieval mode remain
visible. Expected scenarios and observed pinned execution statuses have separate labels.

Citations open the source panel, highlight and focus the relevant source card, and
provide a return-to-citation action. Cards show source path, service, snapshot, commit
and an expandable archive fingerprint. Only absolute HTTP(S) URLs without embedded
credentials become external links. Missing/unsafe URLs leave provenance readable.
Text is rendered through Angular interpolation, rather than as generated HTML.

## Verify

```bash
npm ci
npm test -- --watch=false
npm run check:clients
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Unit checks exercise view states, JSON primitives, verification labels, tab keyboard
navigation, source/return focus, disclosure reset, safe links, raw fallback and viewer
destruction. Existing generated-client parsing, cancellation and scope tests remain.

Desktop and mobile browser checks use the real generated Kiota parsing path with
synthetic HTTP responses. They cover schema/text/tree controls, null and absent
examples, local references, independent contracts, partial/not-found states, long
values, escaped text, safe errors, explicit retry and JSON copy. The
`browser-acceptance-results` CI artifact contains the JUnit results, failure traces
when applicable and an `answer-panel.png` capture for each viewport.

Browser checks and screenshots validate the interface against fixtures. They do not
prove Azure retrieval relevance or deployed model quality. Live source ingestion,
index/model configuration and image activation remain separate backend/deployment steps.
