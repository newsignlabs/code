#!/usr/bin/env bash
# Builds catalyst/newsign_admin.zip for the Catalyst console (Functions -> upload).
# The zip has index.js, package.json, catalyst-config.json and node_modules/ at its root.
# Tests run first; nothing is uploaded.
set -euo pipefail
cd "$(dirname "$0")/functions/newsign_admin"
npm install --omit=dev --no-audit --no-fund >/dev/null
npm test >/dev/null
rm -f ../../newsign_admin.zip
zip -qrX ../../newsign_admin.zip . -x 'test/*' -x '*.DS_Store' -x 'package-lock.json'
echo "catalyst/newsign_admin.zip ($(du -h ../../newsign_admin.zip | cut -f1))"
