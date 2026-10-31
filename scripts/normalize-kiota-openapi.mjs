import { readFileSync, writeFileSync } from 'node:fs';

// Keep the upstream artifact intact. This compatibility view preserves JSON wire values.
// Kiota TS treats Pydantic's recursive all-JSON union as an object and nullable scalar
// unions as composed models. Inline the unconstrained JSON value and normalize nulls.
const document = JSON.parse(readFileSync(process.argv[2], 'utf8'));
function normalize(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(normalize);
  if (value.$ref === '#/components/schemas/JsonValue') return {};
  if (value.anyOf) {
    if (value.anyOf.some((s) => s.$ref === '#/components/schemas/JsonValue')) return {};
    const nonNull = value.anyOf.filter((s) => s.type !== 'null');
    if (nonNull.length === 1 && nonNull.length < value.anyOf.length) {
      const { anyOf, ...rest } = value;
      return { ...normalize(rest), ...normalize(nonNull[0]), nullable: true };
    }
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalize(child)]));
}
const normalized = normalize(document);
delete normalized.components.schemas.JsonValue;
// A union directly inside an array is emitted by Kiota TS as first-success parsing,
// which selects the first shape for every item. A discriminated base makes its
// generated factory select each item's concrete shape before deserialization.
const schemas = normalized.components.schemas;
const items = schemas.Answer.properties.sections.items;
const variants = items.oneOf.map((entry) => entry.$ref.split('/').at(-1));
schemas.AnswerSection = {
  type: 'object',
  required: ['type', 'title', 'sourceIds'],
  discriminator: items.discriminator,
  properties: {
    type: { type: 'string' },
    title: { type: 'string' },
    sourceIds: { type: 'array', items: { type: 'string' } },
  },
};
for (const name of variants) {
  const original = schemas[name];
  schemas[name] = { allOf: [{ $ref: '#/components/schemas/AnswerSection' }, original] };
}
schemas.Answer.properties.sections.items = { $ref: '#/components/schemas/AnswerSection' };
writeFileSync(process.argv[3], JSON.stringify(normalized, null, 2) + '\n');
