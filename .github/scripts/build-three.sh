#!/usr/bin/env bash
# Rebuilds assets/vendor/three.custom.min.js: three.js with only the classes the site's
# scripts use (every THREE.<Name> in assets/*.js), so visitors download less.
# Run it after using a new THREE.<Name> anywhere: .github/scripts/build-three.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
tmp=$(mktemp -d)
names=$(grep -ohE "THREE\.[A-Za-z0-9_]+" assets/*.js | sed 's/THREE\.//' | sort -u | paste -sd, -)
echo "export { $names } from 'three';" > "$tmp/entry.js"
(cd "$tmp" && npm init -y >/dev/null && npm i --silent three@0.169.0 esbuild@0.24.0 \
  && npx esbuild entry.js --bundle --format=esm --minify --target=es2020 --legal-comments=none --outfile=out.js)
{ echo '/* three.js r169 (MIT License, https://threejs.org/) — custom build with only the classes this site uses; see .github/scripts/build-three.sh */'; cat "$tmp/out.js"; } > assets/vendor/three.custom.min.js
rm -rf "$tmp"
echo "assets/vendor/three.custom.min.js: $(wc -c < assets/vendor/three.custom.min.js) bytes"
