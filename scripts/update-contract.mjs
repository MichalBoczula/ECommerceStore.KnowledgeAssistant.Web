import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const [path, commit] = process.argv.slice(2);
if (!path || !/^[0-9a-f]{40}$/.test(commit ?? '')) {
  throw new Error(
    'Usage: node scripts/update-contract.mjs /path/to/Api/contracts/openapi.json API_COMMIT_SHA',
  );
}
const bytes = readFileSync(path);
const spec = JSON.parse(bytes);
if (!spec.paths?.['/api/v1/query']?.post || !spec.components?.schemas?.ApiProblemDetails) {
  throw new Error('Expected Knowledge Assistant OpenAPI with Problem Details.');
}
writeFileSync('contracts/upstream/knowledge-assistant.openapi.json', bytes);
writeFileSync(
  'contracts/upstream/source.json',
  JSON.stringify(
    {
      repository: 'MichalBoczula/ECommerceStore.KnowledgeAssistant.Api',
      commit,
      path: 'contracts/openapi.json',
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    null,
    2,
  ) + '\n',
);
