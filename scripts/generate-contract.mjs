import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
const types = await compileFromFile('contracts/answer.schema.json', {
  bannerComment:
    '/* Generated from the Python API response schema. Run npm run generate:contract. */',
});
await writeFile(
  'src/app/api.generated.ts',
  await format(types, { ...(await resolveConfig('.prettierrc')), parser: 'typescript' }),
);
