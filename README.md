# np-commlink

Shadowrun-styled deck merging `np-timetracker` (tracking, office-time, notifications, barcode/SIGIL) with `np-kitchen-bot` (shopping, storage, tasks, globals) into a single Angular 21 / Ionic 8 / Capacitor 8 app.

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
pnpm i18n:extract   # ngx-translate-extract → src/assets/i18n/de.json
pnpm build:android  # ionic capacitor build android
```

## Layout

DDD / feature-layered under `src/app/<domain>/{data,feature,smart-ui,ui,util}` with module boundaries enforced by Sheriff (`sheriff.config.ts`). See `merge-plan.md` for the merge strategy and `CLAUDE.md` (added in the final commit) for the authoritative developer guide.
