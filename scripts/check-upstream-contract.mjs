import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const path = 'contracts/upstream/knowledge-assistant.openapi.json';
const manifest = JSON.parse(readFileSync('contracts/upstream/source.json', 'utf8'));
const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
if (actual !== manifest.sha256)
  throw new Error('Upstream OpenAPI checksum differs from its reviewed source manifest.');
if (!/^[0-9a-f]{40}$/.test(manifest.commit)) throw new Error('Pin the upstream API commit SHA.');
console.log('Reviewed upstream OpenAPI checksum matches.');
