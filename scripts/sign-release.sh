#!/usr/bin/env bash
#
# sign-release.sh — one command, a signed APK, and the identity never lands in a
# file, in this repo, or in a shell history.
#
# It resolves the four NPC_* values Gradle reads (android-postsync.sh patch 5)
# and exports them into THIS process only, so the parent shell never sees them
# and nothing outlives the build:
#
#   NPC_KEYSTORE_PATH      the single *.jks / *.keystore in .keystore/, or the
#                          variable if already set
#   NPC_KEY_ALIAS          the variable, or .keystore/alias, or a prompt — an
#                          alias is not a secret, so a file is fine
#   NPC_KEYSTORE_PASSWORD  the variable, or an unechoed prompt
#   NPC_KEY_PASSWORD       likewise; an empty answer means "same as the store",
#                          which is what both keytool and Android Studio produce
#                          unless told otherwise
#
# The two passwords are typed per build and stored NOWHERE — no file, no keyring,
# no history (`read -rs` neither echoes nor records). Deliberately so: a password
# at rest beside the key it protects turns one copied directory into a working
# publisher identity, and `.gitignore` would be the only thing keeping either out
# of a commit. Twice-a-year typing is the whole cost, and a release is exactly the
# moment to be sure a human is present. Same reasoning as patch 5 carrying no key
# material — the reference is versioned, the secret is injected.
set -euo pipefail
shopt -s nullglob

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_DIR="$ROOT/.keystore"

# --- the keystore itself ----------------------------------------------------
if [ -z "${NPC_KEYSTORE_PATH:-}" ]; then
  CANDIDATES=("$KEYSTORE_DIR"/*.jks "$KEYSTORE_DIR"/*.keystore)
  case ${#CANDIDATES[@]} in
    0)
      echo "error: no *.jks or *.keystore in $KEYSTORE_DIR — put the keystore there, or set NPC_KEYSTORE_PATH." >&2
      exit 1
      ;;
    1) NPC_KEYSTORE_PATH="${CANDIDATES[0]}" ;;
    *)
      echo "error: ${#CANDIDATES[@]} keystores in $KEYSTORE_DIR; set NPC_KEYSTORE_PATH to pick one:" >&2
      printf '  %s\n' "${CANDIDATES[@]}" >&2
      exit 1
      ;;
  esac
fi

if [ ! -f "$NPC_KEYSTORE_PATH" ]; then
  echo "error: keystore not found at $NPC_KEYSTORE_PATH" >&2
  exit 1
fi

# --- the alias --------------------------------------------------------------
if [ -z "${NPC_KEY_ALIAS:-}" ] && [ -f "$KEYSTORE_DIR/alias" ]; then
  NPC_KEY_ALIAS="$(tr -d '[:space:]' <"$KEYSTORE_DIR/alias")"
fi
if [ -z "${NPC_KEY_ALIAS:-}" ]; then
  read -rp "key alias: " NPC_KEY_ALIAS
fi
if [ -z "$NPC_KEY_ALIAS" ]; then
  echo "error: no key alias — 'keytool -list -v -keystore \"$NPC_KEYSTORE_PATH\"' prints the ones the store has." >&2
  exit 1
fi

# --- the two passwords ------------------------------------------------------
if [ -z "${NPC_KEYSTORE_PASSWORD:-}" ]; then
  read -rsp "keystore password: " NPC_KEYSTORE_PASSWORD
  echo >&2
fi

if [ -z "${NPC_KEY_PASSWORD:-}" ]; then
  read -rsp "key password (empty = same as keystore): " NPC_KEY_PASSWORD
  echo >&2
  [ -z "$NPC_KEY_PASSWORD" ] && NPC_KEY_PASSWORD="$NPC_KEYSTORE_PASSWORD"
fi

if [ -z "$NPC_KEYSTORE_PASSWORD" ] || [ -z "$NPC_KEY_PASSWORD" ]; then
  echo "error: a password was empty — Gradle would fail at configuration time anyway." >&2
  exit 1
fi

echo "sign-release: signing as '$NPC_KEY_ALIAS' with $NPC_KEYSTORE_PATH"

export NPC_KEYSTORE_PATH NPC_KEY_ALIAS NPC_KEYSTORE_PASSWORD NPC_KEY_PASSWORD
exec pnpm run apk:release
