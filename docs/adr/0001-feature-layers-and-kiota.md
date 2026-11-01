# ADR-0001: Feature layers with Kiota at the transport boundary

Status: Accepted

Follow ecommerce-store-web: a feature owns domain models/repository ports, an
application facade, NgRx actions/reducer/effects, infrastructure repositories/mappers
and presentation. Shared infrastructure owns generated API clients and the same-origin
fetch adapter. The root app routes to a lazy page; feature providers bind the port to
its Kiota implementation. UI models do not import generated transport types.

Use the full reviewed Python OpenAPI artifact, not a separately maintained response
schema. Pin the upstream commit/checksum and Kiota 1.37.0, commit generated output,
and reject regeneration drift. Generated request builders serialize requests and parse
success/problem responses. Mappers preserve arbitrary JSON and translate optional DTOs
into required UI models. The UI handles stable problem codes and trace references.

The pinned TypeScript generator needs a deterministic compatibility view for nullable
scalars, recursive all-JSON values and union-array sections. Keep upstream untouched;
normalize only generator input. Test generated parsing for every section and JSON shape.
Do not patch generated output or bypass Kiota with a handwritten query HTTP call.

Effects cancel queries on context/catalog changes. Repository teardown aborts fetch,
and reducers keep cleared answers cleared. The Nginx proxy owns credentials; browser
configuration contains only its same-origin base path.
