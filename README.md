# np-commlink

Shadowrun-styled deck merging `np-timetracker` (tracking, office-time, notifications, barcode/SIGIL) with `np-kitchen-bot` (shopping, storage, products, tasks) and np-trackplay (gameing list) into a single Angular 21 / Ionic 8 / Capacitor 8 app.

**Live:** <https://johnsmithdoe.github.io/np-commlink/> _(published with the first release tag.)_

## Prerequisites

- Trust in Claude... this is a vibe coding project, which i am not really convinced off...
- Node ≥ 22.18 (`.nvmrc` pins the line; a `preinstall` gate enforces the floor and says why)
- pnpm 11.18.x (`packageManager` in `package.json` pins the exact version)
- For the APK only: JDK 21 and Android SDK 36 (Android Studio installs both)

## Common commands

```sh
pnpm install
pnpm start          # ng serve
pnpm build          # ng build --configuration production
pnpm test           # vitest, single run
pnpm test:watch     # vitest, watch
pnpm e2e            # playwright
pnpm lint           # eslint (flat config)
pnpm i18n:extract   # ngx-translate-extract → public/i18n/{de,en}.json (--clean)
pnpm apk:build  # web build + cap sync android + scripts/android-postsync.sh
pnpm apk:debug      # …then gradlew assembleDebug  → android/app/build/outputs/apk/debug/
pnpm apk:open   # open the project in Android Studio
```

## Build it yourself

Nothing here needs a secret, an account, or a config file you have to be told about — the whole
path is four commands from a fresh clone, and no step is gated on the maintainer:

```sh
pnpm install
npx cap add android      # once per machine; android/ is git-ignored and regenerated
pnpm apk:debug           # → android/app/build/outputs/apk/debug/app-debug.apk
```

That APK is signed with your own local debug key, installs on any device with developer options on,
and is functionally the release build. `pnpm apk:release` also works and produces
`releases/np-commlink-unsigned.apk` — unsigned, and named so, because the release signing key is
deliberately not in this repo (below).

## Release signing — why the key is not in here

Publishing the _source_ is what AGPL is for, and it is complete: everything needed to build a
byte-for-byte equivalent app is in this repository. Publishing the _signing key_ would be a
different thing entirely, and it would take a guarantee away from users rather than granting one.

Android decides an APK may replace an installed one purely by comparing signatures. With the key
public, anyone could fork this, add whatever they liked, sign it as the canonical build and hand out
an APK that installs **over** a real one and silently inherits its data — every tracked session, the
pantry, the ledger. Users would have no way to tell the two apart. So the key stays private, the
same way F-Droid, Signal and every Linux distro keep a repository signing key private while shipping
all of their source: openness is about being able to inspect and rebuild the artifact, not about
shared custody of who is allowed to _be_ the publisher. And unlike a leaked password it cannot be
rotated away — a new key can never upgrade an install made with the old one.

The wiring is public even though the key isn't. `scripts/android-postsync.sh` appends a
`signingConfig` that reads four environment variables when Gradle configures, so no key material
ever lands in a file, in `android/`, or in this repo:

```sh
export NPC_KEYSTORE_PATH=/absolute/path/to/release.jks
export NPC_KEYSTORE_PASSWORD=…
export NPC_KEY_ALIAS=…
export NPC_KEY_PASSWORD=…
pnpm apk:release          # → releases/np-commlink.apk, signed (v2 + v3), sha256 printed
```

Or let one command resolve all four — the keystore found in `.keystore/`, the passwords typed at an
unechoed prompt and exported into that process only, stored nowhere:

```sh
pnpm apk:signed           # → releases/np-commlink.apk, signature and fingerprint printed
```

With none of them set there is no `signingConfig` at all and a clone builds unchanged; with only
some set the build stops and names the missing ones. Fork-friendly by construction: your fork signs
with your key by exporting your own four values, and nothing needs patching.

## Verify a release APK

If you take an APK from a release rather than building it, two checks are worth doing — both against
values published with the release, not against anything the APK tells you about itself:

```sh
sha256sum np-commlink.apk                        # must match the digest published with the tag
apksigner verify --print-certs np-commlink.apk   # signer SHA-256 must match the fingerprint below
```

The signer fingerprint is stable for the life of the app, so pinning it once detects any later key
swap:

```text
e67966a34b626cf93245d292a83bb45e6872c5226abf3cd3fd181ab2d25c1b1f
```

`apksigner` should report it as _Signer #1 certificate SHA-256 digest_, and should verify the APK
under **schemes v2 and v3**. v1 (JAR signing) is absent by design — `minSdk 24` has no use for it —
and v3.1 and v4 stay absent until there is something to rotate or a device asking for incremental
install.

## Deployment — GitHub Pages

Live at **<https://johnsmithdoe.github.io/np-commlink/>**, published by `.github/workflows/ci.yml` —
but only on a **version tag**. A push to `main` runs every gate and publishes nothing; pushing
`vMAJOR.MINOR.PATCH` runs the same gates on that ref and then uploads the build as a Pages artifact
for a second job to deploy. So releasing is:

```sh
git tag v1.0.0 && git push origin v1.0.0
```

Pre-release tags (`v1.0.0-rc.1`) are verified but deliberately not published — the tag trigger is
`v*` so they still reach every gate, and a shell regex in the workflow decides which of them ships.
The site is a project site, so it serves under `/np-commlink/`; only a repository named
`johnsmithdoe.github.io` would sit at the domain root.

That subpath is why there are two prod builds: `pnpm build` keeps the relative base href Capacitor
needs, `pnpm build:pages` sets `/np-commlink/`. To check the deployed layout locally:

```sh
pnpm run build:pages
mkdir -p /tmp/pages/np-commlink && cp -r www/browser/* /tmp/pages/np-commlink/
npx http-server /tmp/pages -p 8080   # → http://localhost:8080/np-commlink/
```

Two settings are required on the GitHub repo and are not in version control:

1. **Settings → Pages → Source** → _GitHub Actions_. Without it a deploy has nothing to deploy into.
2. **Settings → Environments → github-pages → Deployment branches and tags** → _Selected branches and
   tags_ → add a rule with **Ref type: Tag**, pattern `v*`. The environment is created protected to
   the default branch, and a branch rule does not cover tags — without this the deploy job fails with
   `Branch "v1.0.0" is not allowed to deploy to github-pages`.

No secret is involved: `deploy-pages` authenticates with a short-lived OIDC token minted from the
job's `id-token: write` permission, so nothing long-lived with write access to the repo exists to
leak or rotate.

## Releasing an APK

CI does everything a release needs except the one step that needs the key. Pushing the version tag
runs every gate, deploys Pages, and opens the GitHub Release as a **draft** — title, install
instructions and verification commands already written. The APK is built and attached from the
machine that holds the keystore:

```sh
git tag v1.0.0 && git push origin v1.0.0   # gates, Pages, and the draft release
pnpm apk:signed                            # → releases/np-commlink.apk, digest printed
```

Then attach the APK to the draft under **Releases**, paste the printed digest into the notes, and
publish. That is the entire manual step, and it is manual on purpose: it is the one moment the
signing key is involved, and the key is on one machine rather than in a secret store because it
**cannot be rotated** — a leak has no remedy except abandoning the app identity, which costs every
user their data. The minutes CI would save are worth less than that.

The tag has to match `package.json`'s version or CI fails the run before drafting anything: the APK
takes its `versionName` and `versionCode` from `package.json`, never from the tag, and a
`versionCode` that does not increase is one Android refuses to install over its predecessor.

## Layout

DDD / feature-layered under `src/app/<domain>/{data,feature,smart-ui,ui,util}` with module boundaries enforced by Sheriff (`sheriff.config.ts`). See `CLAUDE.md` for the authoritative developer guide; beside it, `docs/decisions.md` records settled questions, `docs/footguns.md` the failures that do not reproduce from a read, and `docs/state.md` what is still open. The design history lives in the git commit log.

## License

Copyright (C) 2026 Leto da c0dem0nkey

np-commlink is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License, version 3**, as published by the Free Software Foundation.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [full license text](LICENSE) for details.

In practice: fork it, change it, ship it — but anyone you pass it to gets the source under the same terms, and that includes people who only ever reach it **over a network**. If you host the PWA for others, you owe those users the corresponding source (AGPL §13); the settings page carries the source link that discharges this for the canonical deployment.

Third-party code keeps its own terms: the dependency tree is MIT / Apache-2.0 / 0BSD throughout, and a production build emits their notices to `www/3rdpartylicenses.txt`. The Android APK additionally bundles Google's proprietary ML Kit binary (pulled in by `@capacitor-mlkit/barcode-scanning`), so the APK as shipped is not wholly free software.
