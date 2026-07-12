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
#   4. versionName 1.0.0 / versionCode 1      — release identity
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

# 4. release identity
perl -pi -e 's{versionName "1\.0"}{versionName "1.0.0"};' "$GRADLE"
perl -pi -e 's{versionCode \d+}{versionCode 1};' "$GRADLE"

echo "android-postsync: patched AndroidManifest.xml (camera/flashlight/notifications + mlkit) and build.gradle (1.0.0 / 1)."
