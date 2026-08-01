# np-commlink

Shadowrun-styled deck merging `np-timetracker` (tracking, office-time, notifications, barcode/SIGIL) with `np-kitchen-bot` (shopping, storage, products, tasks) into a single Angular 21 / Ionic 8 / Capacitor 8 app.

## Prerequisites

- Node 22 (`.nvmrc`)
- pnpm 11.18.x (`packageManager` in `package.json` pins the exact version)

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
pnpm build:android  # web build + cap sync android + scripts/android-postsync.sh
pnpm apk:debug      # …then gradlew assembleDebug  → android/app/build/outputs/apk/debug/
pnpm open:android   # open the project in Android Studio
```

First time on a machine: `npx cap add android` once (the folder is git-ignored), then the above.

## Deployment — Codeberg Pages

Live at **<https://letothec0dem0nkey.codeberg.page/np-commlink/>**, published by
`.forgejo/workflows/ci.yml` — but only on a **version tag**. A push to `main` runs every gate and
publishes nothing; pushing `vMAJOR.MINOR.PATCH` runs the same job on that ref and then force-pushes
the build to this repo's `pages` branch as a fresh orphan commit. So releasing is:

```sh
git tag v1.0.0 && git push origin v1.0.0
```

Pre-release tags (`v1.0.0-rc.1`) are verified but deliberately not published. One site per project —
the per-user variant (a repository literally named `pages`) would only serve a single site at the
domain root.

The subpath is why there are two prod builds: `pnpm build` keeps the relative base href Capacitor
needs, `pnpm build:pages` sets `/np-commlink/`. To check the deployed layout locally:

```sh
pnpm run build:pages
mkdir -p /tmp/pages/np-commlink && cp -r www/browser/* /tmp/pages/np-commlink/
npx http-server /tmp/pages -p 8080   # → http://localhost:8080/np-commlink/
```

Two settings are required on the Codeberg repo and are not in version control:

1. **Settings → Units** → enable _Actions_ (off by default).
2. **Settings → Webhooks** → add a **Forgejo** webhook, target URL
   `https://letothec0dem0nkey.codeberg.page/np-commlink/`, branch filter `pages`. Without it the
   git-pages server never hears about a deploy. (Its _Test delivery_ button always errors — that is
   expected; verify by pushing.)

If the push in the deploy step is ever rejected, the automatic `forge.token` lost its write scope:
create an access token with `write:repository`, store it as the repo secret `CODEBERG_TOKEN`, and
use `${{ secrets.CODEBERG_TOKEN }}` in place of `${{ forge.token }}`.

Android APKs are built locally (`pnpm apk:debug`) — release APKs are unsigned, so store publishing
still needs a keystore.

## Layout

DDD / feature-layered under `src/app/<domain>/{data,feature,smart-ui,ui,util}` with module boundaries enforced by Sheriff (`sheriff.config.ts`). See `CLAUDE.md` for the authoritative developer guide and `docs/project-summary.md` for everything else — it indexes the architecture compendium: how the parts talk to each other, the per-feature design decisions, and what is still open. The merge decision log and refactor history live in the git commit log.

## License

Copyright (C) 2026 Leto da c0dem0nkey

np-commlink is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License, version 3**, as published by the Free Software Foundation.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [full license text](LICENSE) for details.

In practice: fork it, change it, ship it — but anyone you pass it to gets the source under the same terms, and that includes people who only ever reach it **over a network**. If you host the PWA for others, you owe those users the corresponding source (AGPL §13); the settings page carries the source link that discharges this for the canonical deployment.

Third-party code keeps its own terms: the dependency tree is MIT / Apache-2.0 / 0BSD throughout, and a production build emits their notices to `www/3rdpartylicenses.txt`. The Android APK additionally bundles Google's proprietary ML Kit binary (pulled in by `@capacitor-mlkit/barcode-scanning`), so the APK as shipped is not wholly free software.
