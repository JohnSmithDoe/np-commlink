#!/usr/bin/env bash
#
# collect-apk.sh — copy the release APK Gradle just built to releases/.
#
# The name it lands under follows the SIGNATURE, not the wish: Gradle writes
# app-release.apk when the four NPC_* variables were exported and
# app-release-unsigned.apk when they were not, and an unsigned build must never
# be reachable under the name a release is published as. Same reasoning as the
# GradleException in android-postsync.sh patch 5 — a silently unsigned
# "release" is the failure mode worth spending a check on.
#
# The source name is read from AGP's output-metadata.json rather than globbed,
# because both names live in the same directory and neither run deletes the
# other: a glob would happily pick up a stale APK from an earlier build in the
# other signing state and publish it as the build that just happened. For the
# same reason the counterpart in releases/ is removed, so the directory never
# holds two files claiming to be this version.
#
# The digest is printed because it is what a release publishes next to the APK —
# the only thing that answers "is this the artifact you built" for someone who
# did not build it (README, "Verify a release APK").
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/android/app/build/outputs/apk/release"
METADATA="$OUT_DIR/output-metadata.json"
DEST_DIR="$ROOT/releases"

if [ ! -f "$METADATA" ]; then
  echo "error: $METADATA not found — assembleRelease writes it; run 'pnpm run apk:release'." >&2
  exit 1
fi

OUTPUT_FILE="$(node -p "require('$METADATA').elements[0].outputFile")"
VERSION_NAME="$(node -p "require('$METADATA').elements[0].versionName")"
VERSION_CODE="$(node -p "require('$METADATA').elements[0].versionCode")"
SOURCE="$OUT_DIR/$OUTPUT_FILE"

if [ ! -f "$SOURCE" ]; then
  echo "error: output-metadata.json names $OUTPUT_FILE, which does not exist in $OUT_DIR." >&2
  exit 1
fi

case "$OUTPUT_FILE" in
  *-unsigned.apk)
    NAME="np-commlink-unsigned.apk"
    COUNTERPART="np-commlink.apk"
    ;;
  *)
    NAME="np-commlink.apk"
    COUNTERPART="np-commlink-unsigned.apk"
    ;;
esac

mkdir -p "$DEST_DIR"
cp "$SOURCE" "$DEST_DIR/$NAME"
rm -f "$DEST_DIR/$COUNTERPART"

if command -v sha256sum >/dev/null 2>&1; then
  DIGEST="$(sha256sum "$DEST_DIR/$NAME")"
else
  DIGEST="$(shasum -a 256 "$DEST_DIR/$NAME")"
fi

echo "collect-apk: releases/$NAME — $VERSION_NAME / $VERSION_CODE"
echo "sha256: ${DIGEST%% *}"

# A signed APK gets its signature read back, because "it built" and "it is
# signed by the key you think" are different claims and only the second one is
# what an upgrade depends on. The signer SHA-256 printed here is the fingerprint
# the README pins (Verify a release APK) — publish it once, and any later key
# swap becomes visible to everyone who checked. apksigner ships in the SDK's
# build-tools and is not on PATH by default, so it is located rather than
# required: a missing SDK weakens the report, it does not fail the build.
if [ "$NAME" = "np-commlink.apk" ]; then
  APKSIGNER="$(command -v apksigner 2>/dev/null || true)"
  if [ -z "$APKSIGNER" ]; then
    for candidate in "${ANDROID_HOME:-$HOME/Library/Android/sdk}"/build-tools/*/apksigner; do
      [ -x "$candidate" ] && APKSIGNER="$candidate"
    done
  fi

  if [ -z "$APKSIGNER" ]; then
    echo "note: apksigner not found — signature not verified (set ANDROID_HOME to enable)."
  else
    "$APKSIGNER" verify --verbose --print-certs "$DEST_DIR/$NAME" |
      grep -E '^(Verifie[sd]|Verified using v[0-9]+ scheme|Signer #1 certificate SHA-256 digest)'
  fi
fi
