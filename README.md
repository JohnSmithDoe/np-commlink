# np-commlink

Shadowrun-styled deck merging `np-timetracker` (tracking, office-time, notifications, notes/SIGIL) with
`np-kitchen-bot` (shopping, storage, products, tasks) and np-trackplay (gaming list) into a single
Angular 21 / Ionic 8 / Capacitor 8 app.

**Live:** <https://johnsmithdoe.github.io/np-commlink/> · **Android:** [latest release](https://github.com/JohnSmithDoe/np-commlink/releases/latest)

## What it does

One deck, and you decide what runs on it. Every concern is a **program** you switch on, off and
reorder. Boot it cold and the deck is empty; load what you need and the rest never exists. Each tile
carries its own live number — open tasks, unread signals, low stock, the account balance — so the home
screen is a status readout, not a launcher grid.

Two vocabularies, one app. The **cyberpunk** skin talks in CREDSTICK, STASH and MEATSPACE; the plain
skin calls them Finances, Pantry and Office time. Same code, same data, one switch — plus light/dark
independent of skin, a per-skin accent colour, and German or English.

| Program | Plain name | What it's for |
| --- | --- | --- |
| **CHRONO** | Time tracking | Timers per task — start, pause, resume. Today, daily, monthly, or the whole raw log, with stats. |
| **MEATSPACE** | Office time | Tap the days you were in. Public holidays, running totals against your target, and a nudge when you're behind. |
| **CREDSTICK** | Finances | Accounts, transactions and transfers. Import a CAMT.053 bank statement, let your rules categorise it, and check the balance reconciles. Recurring schedules, a spending report, a burndown, and a triage list for whatever stayed uncategorised. |
| **MARKET** | Shopping list | What's missing. Type a name, count it up and down, swipe it off in the shop. |
| **STASH** | Pantry | What's actually at home, and what's running low. |
| **CATALOG** | Products | The master data both lists share, so a thing is described once. |
| **SOYKAF** | Recipes | The recipe book behind the shopping list. |
| **AGENDA** | Tasks | The plain task list, for everything that isn't its own program. |
| **DAILY RUN** | Task of the Day | One prompt a day out of a catalogue. Streak-free by design. |
| **BIOMON** | Health | Weight logs and pill schedules for everyone in the household — people and pets. Per-weekday times, dose, and a reminder that knows whether today's was already taken. |
| **TRACKPLAY** | Game scores | Round-by-round scoring for game night, with players, game types and per-player stats. |
| **SIGIL** | Notes | Notes with images attached. |
| **COMMS** | Notifications | One inbox every program writes to, plus real OS notifications when something is due. |
| **GEIST** | Assistant | A language model that runs **on your device** — no request leaves it, no key needed. Where the browser offers one. |
| **SYSOP** | Settings | Skin, light/dark, language, accents — and which programs are on the deck. |

**No account, no server, nothing phoning home.** There is no backend. Everything lives on the device —
NgRx in memory, `@ionic/storage` on disk — so the app works on a plane and there is no privacy policy
to read: no telemetry, no analytics, no third party. Installable as a PWA or an APK you can build
yourself, and the source is AGPL, so it stays that way.

## Prerequisites

- Trust in Claude… this is a vibe coding project, which I am not really convinced of.
- Node ≥ 22.18 (`.nvmrc` pins the line; a `preinstall` gate enforces the floor)
- pnpm 11.18.x (`packageManager` in `package.json` pins the exact version)
- For the APK only: JDK 21 and Android SDK 36 (Android Studio installs both)

## Common commands

```sh
pnpm install
pnpm start          # ng serve
pnpm build          # ng build --configuration production
pnpm test           # vitest, single run
pnpm e2e            # playwright
pnpm lint           # eslint (flat config)
pnpm i18n:extract   # ngx-translate-extract → public/i18n/{de,en}.json (--clean)
pnpm apk:build      # web build + cap sync android + scripts/android-postsync.sh
pnpm apk:debug      # …then gradlew assembleDebug → android/app/build/outputs/apk/debug/
pnpm apk:open       # open the project in Android Studio
```

## Build it yourself

Nothing needs a secret, an account or a config file — two commands from a fresh clone:

```sh
pnpm install
pnpm apk:debug           # → android/app/build/outputs/apk/debug/app-debug.apk
```

`android/` is committed, so there is no `cap add` step. You need JDK 21 and Android SDK 36;
`local.properties` is generated locally and stays out of git.

That APK is signed with your own local debug key and is functionally the release build.
`pnpm apk:release` produces `releases/np-commlink-unsigned.apk` — unsigned, and named so.

## Release signing — why the key is not in here

Android decides an APK may replace an installed one purely by comparing signatures. With the key
public, anyone could fork this, sign it as the canonical build and hand out an APK that installs
**over** a real one and silently inherits its data. Unlike a leaked password it cannot be rotated — a
new key can never upgrade an install made with the old one. So the key stays private, the same way
F-Droid, Signal and every Linux distro keep a repository signing key private while shipping all of
their source.

The wiring is public even though the key isn't. `scripts/android-postsync.sh` appends a `signingConfig`
that reads four environment variables when Gradle configures, so no key material lands in a file, in
`android/`, or in this repo:

```sh
export NPC_KEYSTORE_PATH=/absolute/path/to/release.jks
export NPC_KEYSTORE_PASSWORD=…
export NPC_KEY_ALIAS=…
export NPC_KEY_PASSWORD=…
pnpm apk:release          # → releases/np-commlink.apk, signed (v2 + v3), sha256 printed
```

Or let one command resolve all four — keystore found in `.keystore/`, passwords typed at an unechoed
prompt and exported into that process only:

```sh
pnpm apk:signed           # → releases/np-commlink.apk, signature and fingerprint printed
```

With none set there is no `signingConfig` at all and a clone builds unchanged; with only some set the
build stops and names the missing ones. A fork signs with its own key by exporting its own four values.

## Verify a release APK

Both checks are against values published with the release, not against anything the APK says about itself:

```sh
sha256sum np-commlink.apk                        # must match the digest published with the tag
apksigner verify --print-certs np-commlink.apk   # signer SHA-256 must match the fingerprint below
```

The signer fingerprint is stable for the life of the app:

```text
e67966a34b626cf93245d292a83bb45e6872c5226abf3cd3fd181ab2d25c1b1f
```

`apksigner` should report it as _Signer #1 certificate SHA-256 digest_ and verify under **schemes v2
and v3**. v1 (JAR signing) is absent by design — `minSdk 24` has no use for it — and v3.1 and v4 stay
absent until there is something to rotate or a device asking for incremental install.

## Deployment — GitHub Pages

Published by `.github/workflows/release.yml`, and only on a **version tag**. Nothing else triggers it:
the gates run on `git push` via lefthook, so a tag arrives already verified and the workflow only
publishes. Pushing `vMAJOR.MINOR.PATCH` builds and uploads the Pages artifact; pre-release tags
(`v1.0.0-rc.1`) reach the workflow and are deliberately not published — the tag trigger is `v*` and a
shell regex decides which ship.

The site is a project site, so it serves under `/np-commlink/`. That subpath is why there are two prod
builds: `pnpm build` keeps the relative base href Capacitor needs, `pnpm build:pages` sets
`/np-commlink/`. To check the deployed layout locally:

```sh
pnpm run build:pages
mkdir -p /tmp/pages/np-commlink && cp -r www/browser/* /tmp/pages/np-commlink/
npx http-server /tmp/pages -p 8080   # → http://localhost:8080/np-commlink/
```

Two GitHub settings are required and are not in version control:

1. **Settings → Pages → Source** → _GitHub Actions_.
2. **Settings → Environments → github-pages → Deployment branches and tags** → _Selected branches and
   tags_ → a rule with **Ref type: Tag**, pattern `v*`. The environment is created protected to the
   default branch, and a branch rule does not cover tags — without this the deploy fails with
   `Branch "v1.0.0" is not allowed to deploy to github-pages`.

No secret is involved: `deploy-pages` authenticates with a short-lived OIDC token minted from the job's
`id-token: write` permission.

## Releasing an APK

Pushing the version tag deploys Pages and opens the GitHub Release as a **draft** — the gates already
ran on the push that carried the commit. The APK is built and attached from the machine that holds the
keystore:

```sh
git tag v1.0.0 && git push origin v1.0.0   # Pages, and the draft release
pnpm apk:signed                            # → releases/np-commlink.apk, digest printed
```

Then attach the APK to the draft, paste the printed digest into the notes, and publish. That manual
step is the one moment the signing key is involved, and the key is on one machine rather than in a
secret store because it **cannot be rotated**.

The tag has to match `package.json`'s version or CI fails before drafting: the APK takes its
`versionName` and `versionCode` from `package.json`, never from the tag, and a `versionCode` that does
not increase is one Android refuses to install over its predecessor.

## Layout

DDD / feature-layered under `src/app/<domain>/{data,feature,smart-ui,ui,util}` with module boundaries
enforced by Sheriff (`sheriff.config.ts`). `CLAUDE.md` is the authoritative developer guide; beside it
`docs/` holds settled decisions, per-domain reasoning, footguns, current state and the next version's
scope.

## License

Copyright (C) 2026 Leto the c0dem0nkey

np-commlink is free software: you can redistribute it and/or modify it under the terms of the **GNU
Affero General Public License, version 3**, as published by the Free Software Foundation.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[full license text](LICENSE) for details.

In practice: fork it, change it, ship it — but anyone you pass it to gets the source under the same
terms, and that includes people who only ever reach it **over a network**. If you host the PWA for
others, you owe those users the corresponding source (AGPL §13); the settings page carries the source
link that discharges this for the canonical deployment.

Third-party code keeps its own terms: the dependency tree is MIT / Apache-2.0 / 0BSD throughout, and a
production build emits their notices to `www/3rdpartylicenses.txt`. **The APK carries no proprietary
component** — the barcode scanner that did (Google's ML Kit, 21 MB of it) was removed rather than
shipped, and what a free-software replacement would cost is in
[next-version.md](docs/next-version.md).
