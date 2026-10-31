#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
version=1.37.0
archive_sha256=220b5a606060ca581944310aa903c9a480826c2cf27c2072a8f384032595dd6f
node scripts/check-upstream-contract.mjs
mkdir -p .tools
if [[ -n "${KIOTA_BIN:-}" ]]; then
  kiota_bin="$KIOTA_BIN"
elif [[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]]; then
  tool_dir="$PWD/.tools/kiota-$version"
  kiota_bin="$tool_dir/kiota"
  if [[ ! -x "$kiota_bin" ]]; then
    temp_dir="$(mktemp -d "$PWD/.tools/kiota-download.XXXXXX")"
    trap 'rm -rf "$temp_dir"' EXIT
    curl --fail --location --silent --show-error --retry 3 \
      "https://github.com/microsoft/kiota/releases/download/v$version/linux-x64.zip" \
      --output "$temp_dir/kiota.zip"
    echo "$archive_sha256  $temp_dir/kiota.zip" | sha256sum --check --status
    unzip -q "$temp_dir/kiota.zip" kiota appsettings.json -d "$temp_dir"
    chmod +x "$temp_dir/kiota"
    mv "$temp_dir" "$tool_dir"
    trap - EXIT
  fi
else
  echo "Set KIOTA_BIN to a Kiota $version executable on this platform." >&2
  exit 1
fi
actual_version="$("$kiota_bin" --version)"
if [[ "$actual_version" != "$version" && "$actual_version" != "$version"+* ]]; then
  echo "Expected Kiota $version; found $actual_version" >&2
  exit 1
fi
spec=.tools/knowledge-kiota.openapi.json
node scripts/normalize-kiota-openapi.mjs contracts/upstream/knowledge-assistant.openapi.json "$spec"
"$kiota_bin" generate --openapi "$spec" --language TypeScript \
  --class-name KnowledgeApiClient --namespace-name ApiSdk \
  --output src/app/shared/infrastructure/api-clients/knowledge \
  --additional-data --clean-output --log-level Warning
rm -f src/app/shared/infrastructure/api-clients/knowledge/.kiota.log
npx --no-install prettier --write 'src/app/shared/infrastructure/api-clients/knowledge/**/*.ts'
