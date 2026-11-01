import { execFileSync } from 'node:child_process';
const path = 'src/app/shared/infrastructure/api-clients/knowledge';
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', path], { stdio: 'inherit' });
if (
  execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', path], {
    encoding: 'utf8',
  }).trim()
) {
  throw new Error(
    'Generated client contains uncommitted new files. Regenerate and commit the complete client.',
  );
}
