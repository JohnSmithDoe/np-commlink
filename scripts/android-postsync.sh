#!/usr/bin/env bash
#
# android-postsync.sh — re-apply the native edits that Capacitor regenerates
# away on every `cap add android` / `cap sync`.
#
# The android/ project is intentionally NOT committed (see .gitignore); it is
# regenerated on demand. Run this immediately after generating/syncing it:
#
#   pnpm run build && npx cap add android && npx cap sync android
#   ./scripts/android-postsync.sh
#
# Idempotent: safe to run repeatedly. Patches:
#   1. CAMERA / FLASHLIGHT permissions        — mlkit EAN-13 scanner
#   2. POST_NOTIFICATIONS permission          — Android 13+ local notifications
#   3. mlkit barcode_ui install meta-data     — bundles the scanner UI module
#   4. versionName / versionCode              — release identity, from package.json
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/android/app/src/main/AndroidManifest.xml"
GRADLE="$ROOT/android/app/build.gradle"

if [ ! -f "$MANIFEST" ]; then
  echo "error: $MANIFEST not found — run 'npx cap add android' first." >&2
  exit 1
fi

# 1 + 2. permissions — inserted after INTERNET, only if CAMERA is absent
perl -0pi -e '
  BEGIN {
    $perms = qq{\n    <uses-permission android:name="android.permission.CAMERA" />}
           . qq{\n    <uses-permission android:name="android.permission.FLASHLIGHT" />}
           . qq{\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />};
  }
  s{(<uses-permission android:name="android.permission.INTERNET" />)}{$1$perms}
    unless /android.permission.CAMERA/;
' "$MANIFEST"

# 3. mlkit barcode_ui install-time meta-data — inside <application>, if absent
perl -0pi -e '
  s{(\n[ \t]*</application>)}{\n        <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui" />$1}
    unless /com\.google\.mlkit\.vision\.DEPENDENCIES/;
' "$MANIFEST"

# 4. release identity — derived, so package.json stays the only place a version
#    is written (the web build injects the same value via esbuild `define`).
#
#    versionCode is what Android actually compares to decide an install is an
#    upgrade: a code that does not increase is rejected with
#    INSTALL_FAILED_VERSION_DOWNGRADE, and the only way in is to uninstall —
#    which wipes the IndexedDB holding every tracked session, the pantry and the
#    ledger. Hence derived rather than pinned.
#
#    CONSTRAINT: minor and patch must each stay below 100, since 0.1.100 and
#    0.2.0 would both compute to 200. The failure is silent at build time and
#    only shows up as an APK Android refuses to install over its predecessor.
VERSION_NAME="$(node -p "require('$ROOT/package.json').version")"
VERSION_CODE="$(node -p "
  const [major, minor, patch] = require('$ROOT/package.json').version.split('.').map(Number);
  major * 10000 + minor * 100 + patch;
")"

perl -pi -e "s{versionName \"[^\"]*\"}{versionName \"$VERSION_NAME\"};" "$GRADLE"
perl -pi -e "s{versionCode \\d+}{versionCode $VERSION_CODE};" "$GRADLE"

echo "android-postsync: patched AndroidManifest.xml (camera/flashlight/notifications + mlkit) and build.gradle ($VERSION_NAME / $VERSION_CODE)."
