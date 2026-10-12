#!/usr/bin/env bash
#
# Replaces src/vendor/jam/ with the axios client a running jamserve generates,
# and records that server's API version in src/vendor/jam/VERSION — the copy is
# otherwise untied to any server. Point it at the server the app talks to:
#
#   ./scripts/update-jam-client.sh [http://localhost:4040]
#
# The tree is touched only after the zip has downloaded and unpacked cleanly.
# Array-param serialization is patched in music/data/jam.client.ts, not here.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/src/vendor/jam"
SERVER="${1:-http://localhost:4040}"
SERVER="${SERVER%/}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PING="$(curl -fsS "$SERVER/jam/v1/ping")"
VERSION="$(node -p 'JSON.parse(process.argv[1]).version' "$PING")"

curl -fsS -o "$WORK/client.zip" "$SERVER/docs/axios-client.zip"
mkdir "$WORK/client"
unzip -q "$WORK/client.zip" -d "$WORK/client"

if [ ! -f "$WORK/client/jam.service.ts" ]; then
  echo "error: $SERVER/docs/axios-client.zip holds no jam.service.ts at its root." >&2
  exit 1
fi

PREVIOUS="$(cat "$TARGET/VERSION" 2>/dev/null || echo unknown)"
rm -rf "$TARGET"
mv "$WORK/client" "$TARGET"
echo "$VERSION" > "$TARGET/VERSION"

echo "jam client: $PREVIOUS -> $VERSION (from $SERVER)"
echo "next: pnpm run build && pnpm test"
