#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Section 7 Handoff: Build & Deployment Review ==="
echo
echo "Open Section 7 in docs/CODEBASE_ANALYSIS.md"
rg -n "## 7\\. Build & Deployment" docs/CODEBASE_ANALYSIS.md || true
echo
echo "Suggested context view:"
echo "  sed -n '3669,4385p' docs/CODEBASE_ANALYSIS.md"
echo

echo "=== Key Config Files ==="
echo "next.config.js"
nl -ba next.config.js
echo
echo "next.config.ts"
nl -ba next.config.ts
echo
echo "tsconfig.json"
nl -ba tsconfig.json
echo
echo "firebase.json"
nl -ba firebase.json
echo
echo "firestore.rules"
nl -ba firebase/firestore.rules
echo

echo "=== Lint Config ==="
if rg --files -g ".eslintrc*" -g "eslint.config.*" -g ".eslint*" >/dev/null 2>&1; then
  rg --files -g ".eslintrc*" -g "eslint.config.*" -g ".eslint*"
else
  echo "No ESLint config file found (verify in repo root)."
fi
echo

echo "=== CI/CD Workflows ==="
if [ -d ".github/workflows" ]; then
  rg --files -g ".github/workflows/*.yml" -g ".github/workflows/*.yaml"
  echo
  for wf in .github/workflows/*.yml .github/workflows/*.yaml; do
    [ -f "$wf" ] || continue
    echo "--- $wf ---"
    nl -ba "$wf"
    echo
  done
else
  echo "No .github/workflows directory found."
fi
echo

echo "=== Package Scripts ==="
nl -ba package.json | sed -n '1,200p'
echo

echo "=== Quick Validation Checklist ==="
cat <<'CHECKLIST'
- Confirm which Next config file is actually used (js vs ts).
- Verify build steps in CI (lint/test/type-check/build).
- Check Firebase hosting config matches Next output (public/rewrites).
- Validate TS config recommendations (target, skipLibCheck, allowJs).
- Ensure Node version is pinned in workflows.
- Check for doc auto-commit workflows and approval gates.
CHECKLIST
