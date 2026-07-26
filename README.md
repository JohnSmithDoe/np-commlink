# np-commlink

Shadowrun-styled deck merging `np-timetracker` (tracking, office-time, notifications, barcode/SIGIL) with `np-kitchen-bot` (shopping, storage, products, tasks) into a single Angular 21 / Ionic 8 / Capacitor 8 app.

## Prerequisites

- Node 22 (`.nvmrc`)
- pnpm 11.9.x (`packageManager` in `package.json`)

## Common commands

```sh
pnpm install
pnpm start          # ng serve
pnpm build          # ng build --configuration production
pnpm test           # vitest, single run
pnpm test:watch     # vitest, watch
pnpm e2e            # playwright
pnpm lint           # eslint (flat config)
pnpm i18n:extract   # ngx-translate-extract → public/i18n/de.json
pnpm build:android  # web build + cap sync android + scripts/android-postsync.sh
pnpm apk:debug      # …then gradlew assembleDebug  → android/app/build/outputs/apk/debug/
pnpm open:android   # open the project in Android Studio
```

First time on a machine: `npx cap add android` once (the folder is git-ignored), then the above.

## Layout

DDD / feature-layered under `src/app/<domain>/{data,feature,smart-ui,ui,util}` with module boundaries enforced by Sheriff (`sheriff.config.ts`). See `CLAUDE.md` for the authoritative developer guide, `docs/architecture.md` for how the parts talk to each other, and `docs/open-tasks.md` for open work. The merge decision log and refactor history live in the git commit log.
