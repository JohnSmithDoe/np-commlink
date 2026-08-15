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
#   5. release signingConfig                  — reads NPC_* env vars, opt-in
#   6. launcher label                         — appName, from capacitor.config.ts
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/android/app/src/main/AndroidManifest.xml"
GRADLE="$ROOT/android/app/build.gradle"
STRINGS="$ROOT/android/app/src/main/res/values/strings.xml"

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

# 5. release signing — appended once, and it contains NO key material.
#
#    The four values are read from the environment when Gradle configures, so
#    the signing identity never lands in a file this script writes, in android/,
#    or in a shell history. Consequences by design:
#
#      none of the four set  -> no signingConfig exists at all, and
#                               `apk:release` yields app-release-unsigned.apk.
#                               A fresh clone therefore builds with zero setup —
#                               that is the FOSS contract: anyone can build it,
#                               nobody but the owner can sign AS the owner.
#      some set              -> a GradleException naming the missing variables,
#                               rather than an obscure apksigner failure or —
#                               worse — a silently unsigned "release".
#
#    Why the key stays out of the repo at all: it is the only thing Android
#    compares to decide an APK may replace an installed one. A published key
#    lets anyone ship a modified build that upgrades over the real install and
#    inherits its data, indistinguishably. AGPL obliges publishing the source,
#    never the identity — and it cannot be rotated, only abandoned.
#    Replaced rather than skipped-if-present: the block is always last, so it is
#    cut back to the marker and re-appended every run. An append-if-absent guard
#    would make this script's own copy authoritative only on a freshly generated
#    android/ — every edit here would silently miss the machine it was written on.
perl -0pi -e 's{\n*// --- np-commlink release signing.*\z}{\n}s' "$GRADLE"
cat >> "$GRADLE" <<'GRADLE_SIGNING'

// --- np-commlink release signing (scripts/android-postsync.sh, patch 5) ---
def npcSigningVars = ['NPC_KEYSTORE_PATH', 'NPC_KEYSTORE_PASSWORD', 'NPC_KEY_ALIAS', 'NPC_KEY_PASSWORD']
def npcSigning = npcSigningVars.collectEntries { [it, System.getenv(it)?.trim()] }

if (npcSigning.any { it.value }) {
    def npcMissing = npcSigning.findAll { !it.value }.keySet()
    if (npcMissing) {
        throw new GradleException(
            "np-commlink: release signing needs all of ${npcSigningVars}; unset: ${npcMissing.join(', ')}"
        )
    }

    def npcStoreFile = file(npcSigning.NPC_KEYSTORE_PATH)
    if (!npcStoreFile.isFile()) {
        throw new GradleException("np-commlink: keystore not found at ${npcStoreFile} (NPC_KEYSTORE_PATH)")
    }

    android.signingConfigs.create('release') {
        storeFile npcStoreFile
        storePassword npcSigning.NPC_KEYSTORE_PASSWORD
        keyAlias npcSigning.NPC_KEY_ALIAS
        keyPassword npcSigning.NPC_KEY_PASSWORD
        // v3 carries a proof-of-rotation lineage, so it is the ONLY thing that
        // can ever make this key replaceable (SDK 28+; rotation still has to be
        // signed by the old key, so it is no substitute for backing it up). AGP
        // defaults it off at minSdk 24 and an APK published without it can never
        // be rotated afterwards — hence on from the first release, not later.
        enableV3Signing = true
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.release
}
GRADLE_SIGNING

# 6. launcher label — Capacitor writes appName into strings.xml when it
#    SCAFFOLDS the project and never again, so editing capacitor.config.ts does
#    not reach an android/ that already exists. Without this the label is
#    whatever `cap add` happened to see, and differs between machines.
#
#    Cosmetic, not identity: Android decides an APK may replace an install from
#    applicationId + signature, so this is free to change across releases.
APP_NAME="$(node -p "
  const source = require('fs').readFileSync('$ROOT/capacitor.config.ts', 'utf8');
  (source.match(/appName:\s*'([^']*)'/) || [])[1] || '';
")"

if [ -z "$APP_NAME" ]; then
  echo "error: no appName found in capacitor.config.ts" >&2
  exit 1
fi

perl -pi -e "s{(<string name=\"(?:app_name|title_activity_main)\">)[^<]*(</string>)}{\$1$APP_NAME\$2}g" "$STRINGS"

echo "android-postsync: patched AndroidManifest.xml (camera/flashlight/notifications + mlkit), build.gradle ($VERSION_NAME / $VERSION_CODE + release signing hook) and strings.xml (label '$APP_NAME')."
