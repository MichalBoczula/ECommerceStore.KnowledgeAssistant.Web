#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
image="${1:?Usage: scripts/smoke-image.sh IMAGE}"
name="knowledge-web-smoke-$$"
work="$(mktemp -d)"
cleanup() {
  local status=$?
  if (( status != 0 )); then docker logs "$name" >&2 || true; fi
  docker rm -f "$name" >/dev/null 2>&1 || true
  rm -rf "$work"
  return "$status"
}
trap cleanup EXIT
# Nginx resolves the upstream on startup. This smoke verifies packaged static assets;
# the application browser tests verify query rendering separately.
docker run -d --name "$name" --add-host knowledge-api:127.0.0.1 -p 127.0.0.1::8080 \
  -e KNOWLEDGE_API_URL=http://knowledge-api:8080 \
  -e KNOWLEDGE_API_KEY=knowledge-smoke-only-000000000000 "$image" >/dev/null
base="http://$(docker port "$name" 8080/tcp)"
for attempt in {1..30}; do
  if curl --fail --silent --max-time 3 "$base/health/live" -o /dev/null; then break; fi
  sleep 1
done
curl --fail --silent --show-error --max-time 10 "$base/health/live" -o /dev/null
curl --fail --silent --show-error --max-time 10 "$base/health/ready" -o /dev/null
curl --fail --silent --show-error --max-time 10 "$base/" -o "$work/index.html"
curl --fail --silent --show-error --max-time 10 "$base/knowledge" -o "$work/route.html"
curl --fail --silent --show-error --max-time 10 "$base/favicon.svg" -o /dev/null
asset="$(python3 - "$work" <<'PY'
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
index = (root / 'index.html').read_text()
assert '<app-root' in index and '<app-root' in (root / 'route.html').read_text()
assert 'knowledge-smoke-only-000000000000' not in index
match = re.search(r'<script[^>]+src="([^"]+\.js)"', index)
assert match, 'Missing built JavaScript asset'
print(match.group(1))
PY
)"
curl --fail --silent --show-error --max-time 10 "$base/${asset#/}" -o "$work/asset.js"
python3 - "$work/asset.js" <<'PY_CHECK'
import sys
from pathlib import Path
assert b'knowledge-smoke-only-000000000000' not in Path(sys.argv[1]).read_bytes()
PY_CHECK
echo "Health, SPA fallback, favicon and $asset passed for $image"
