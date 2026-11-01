#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command="${1:?Usage: scripts/ci.sh source|contract|audit|build|unit|acceptance}"
summarize() {
  local report="$1" label="$2" status="$3"
  python3 scripts/summarize-tests.py "$report" "$label" \
    "${VERIFY_SUMMARY_FILE:-artifacts/verification/summary.md}" || { if (( status == 0 )); then return 1; fi; }
  return "$status"
}
case "$command" in
  source)
    git diff --check
    for script in scripts/*.sh; do bash -n "$script"; done
    for script in scripts/*.mjs; do node --check "$script"; done
    python3 -m py_compile scripts/*.py
    ;;
  contract) npm run check:clients ;;
  audit) npm audit --audit-level=high ;;
  build)
    npm run format:check
    npm run build
    ;;
  unit)
    report="artifacts/verification/unit/results.xml"
    mkdir -p "$(dirname "$report")"
    status=0
    npm test -- --watch=false --reporters=junit --output-file="$report" || status=$?
    summarize "$report" 'Angular unit tests' "$status"
    ;;
  acceptance)
    report="$PWD/artifacts/verification/browser/results.xml"
    mkdir -p "$(dirname "$report")"
    status=0
    PLAYWRIGHT_JUNIT_OUTPUT_FILE="$report" npm run test:e2e -- \
      --reporter=line,junit --trace=retain-on-failure \
      --output=artifacts/verification/browser/test-results || status=$?
    summarize "$report" 'Desktop/mobile browser tests' "$status"
    ;;
  *) echo "Unknown verification command: $command" >&2; exit 2 ;;
esac
