---
name: np-prepare-release
description: >-
  Prepare a release commit for a given version: bump package.json, derive the
  changelog from the log since the last tag, and write it into the release notes
  in ci.yml. Use when asked to "/np-prepare-release v1.2.0", "prepare the release",
  "cut a release", "bump the version", or "write the release notes". Prepares the
  tree only — it never commits, tags, pushes, or signs.
---

# np-prepare-release

Takes one argument, the version, as `vMAJOR.MINOR.PATCH`:

```
/np-prepare-release v1.2.0
```

It leaves the tree ready for a release commit and **stops there**. Committing, tagging,
pushing, `pnpm apk:signed` and publishing the draft are Martin's — the tag is what triggers
CI, and the keystore is on one machine on purpose (README, _Release signing_).

**No argument: propose, never pick.** Read the commit types in the range and suggest one
(`!` → major, `feat` → minor, otherwise patch), then wait. The number is a one-way door and
the repo's own naming — `docs/next-version.md` reserves the next major for a scope that has
to have *shipped* — is not derivable from the log.

## What it writes

Two files, and nothing else:

| File | Change |
| --- | --- |
| `package.json` | `version`, without the `v` |
| `.github/workflows/ci.yml` | the changelog, inside the `cat > notes.md <<'EOF'` heredoc in the `release` job |

`package.json` is the **only** place a version is written: the web build injects it through
esbuild `define`, and `scripts/android-postsync.sh` patch 2 derives both `versionName` and
`versionCode` from it. Never edit `android/app/build.gradle` to match.

## Refuse before touching anything

Each of these is cheaper to catch here than after a tag is pushed.

- **Shape.** `^v[0-9]+\.[0-9]+\.[0-9]+$` — the same regex `ci.yml` asserts. A pre-release
  tag (`v1.2.0-rc.1`) runs every gate and is deliberately **never published**, so preparing
  one writes notes nothing will read.
- **Minor and patch each below 100.** `versionCode` is `major*10000 + minor*100 + patch`, so
  `1.1.100` and `1.2.0` both compute to `10200`. Silent at build time; shows up as an APK
  Android refuses to install.
- **Strictly greater than the last tag.** A `versionCode` that does not increase is rejected
  with `INSTALL_FAILED_VERSION_DOWNGRADE`, and the only way in is an uninstall that takes
  every tracked session, the pantry and the ledger with it.
- **The tag must not exist yet** — `git rev-parse -q --verify "refs/tags/$V"`.
- **No handbook figure still flagged stale:**

  ```sh
  grep -l '"shotsStale": true' public/handbook/pages/*.json
  ```

  A release publishes the figures, so any flag left set means `pnpm run handbook:shots` has
  not been run for this release. **Stop and name the pages** — do not run the suite (see
  `CLAUDE.md`; it is Martin's, on a clean tree, and never an agent's).

A dirty working tree is **expected** here, not an error: the release commit carries the
refreshed handbook alongside the bump. Report what is uncommitted; do not clean it.

## The changelog

Range is `<last tag>..HEAD` — `git describe --tags --abbrev=0` for the left side.

**Keep** `feat`, `fix`, `perf`. **Drop** `docs`, `chore`, `style`, `refactor`, `test`,
`release`, and drop any scope that is internal to the build — `gates`, `lint`, `test`, `ci`,
`deps`. A gate is not news to a user. Last two cycles that left 35 of 61 commits, and 24 of 25.

Four headings, in this order, each omitted when empty:

| Heading | From |
| --- | --- |
| **Breaking** | the `!` marker, or a `BREAKING CHANGE:` footer |
| **New** | `feat` |
| **Fixed** | `fix` |
| **Faster** | `perf` |

**The subject is already the sentence.** These commits are written as chapter headlines —
_"the deck learns to weigh you, and your cat by difference"_ — so carry them over as written.
Do not rewrite them into marketing copy, and do not expand them from the body.

English, matching every published release and the README.

### Name the program, not the folder

Scopes are code names; the app is German and calls its programs something else. The
authority is the handbook page ids — `public/handbook/pages/*.json`, which is the vocabulary
a reader has actually seen:

`cash` → CREDSTICK · `vitals` → BIOMON · `notes` → SIGIL · `ritual` → DAILY RUN ·
`tasks` → AGENDA · `tracking` → CHRONO · `office-time` → MEATSPACE · `settings` → SYSOP ·
`deck`/`commlink` → the deck · `notifications` → COMMS

Two cases need judgment rather than the table. **`household` spans three programs** — STASH,
MARKET and SOYKAF — so read the subject: the recipe book is SOYKAF, the pantry is STASH.
And the **cross-cutting scopes** (`list`, `undo`, `ui`, `a11y`, `dialogs`, `nav`,
`empty-states`, `persistence`, `i18n`, `style`) name no program at all; group those last
under their heading with no prefix.

## Then

1. Run the gates — `np-verify-all`, or `./scripts/verify-all.sh`. CI runs them again on the
   tag, but a red tag is a deleted tag, and a deleted tag that was already drafted needs the
   release deleted by hand first.
2. Show the two diffs and stop. The notes are prose in a diff, which is the whole point of
   writing them into the workflow rather than deriving them at tag time: they get read before
   they ship.
3. Print the commands, do not run them:

   ```sh
   git add -A && git commit          # release(vX.Y.Z): …
   git tag vX.Y.Z && git push origin main vX.Y.Z
   pnpm apk:signed                   # → releases/np-commlink.apk, digest printed
   ```

   Then Martin attaches the APK to the draft, pastes the digest, and publishes.

## Traps

- **The heredoc is quoted — `<<'EOF'`** — so nothing in the notes is expanded by the shell.
  Keep it quoted. Unquoting it makes every `$` and backtick in a commit subject live code
  inside a job that holds `contents: write`.
- **Do not touch the APK/verify block below the changelog.** It is the same bytes in every
  release and is what the README's fingerprint section refers to.
- **The `release` job has no checkout, deliberately** — `gh` addresses the repo through
  `GH_REPO`. That is *why* the notes are literal text in the workflow. Do not "improve" this
  into a `git log` at tag time: it would need `fetch-depth: 0`, and a shallow clone renders an
  empty changelog **silently**.
- **CI fails the tag if it disagrees with `package.json`**, before drafting anything. That
  check is the reason the bump and the notes belong in one commit.
- **`git commit -F - <<EOF` deadlocks against lefthook** — write the message to a file and
  pass the path, with `< /dev/null`.

## Report

- the version, and the range it read (`v1.1.0..HEAD`, _n_ commits, _m_ kept);
- the changelog as it will publish — not a summary of it;
- anything dropped that a human might have expected to see, named;
- the gate verdict;
- the three commands, and that they are his to run.
