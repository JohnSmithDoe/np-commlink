# Build & deployment — commands, Android, release identity, CI/CD

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §11 — the command table, Capacitor/Android and the postsync patches, the version as a
> single writer (`package.json` → esbuild `define` → app + Gradle), the SwUpdate prompt and why it
> had to ship in v1, and the Codeberg Forgejo one-job pipeline + Pages deploy.
> **See also:** what still blocks the first release (§12) → [open-tasks.md](./open-tasks.md).

## 11. Build & deployment

### Commands

| Command                             | Does                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm start`                        | dev server (`ng serve`)                                                         |
| `pnpm run build`                    | prod web build → `www/browser`, `--base-href ./` (for Capacitor)                 |
| `pnpm run build:pages`              | prod web build with `--base-href /np-commlink/` (for Codeberg Pages)             |
| `pnpm test` / `pnpm run e2e`        | Vitest one-shot via `@angular/build:unit-test` / Playwright                      |
| `pnpm run lint`                     | `tsc -p eslint-plugin-commlink` → `ng lint` → stylelint. The eslint half is angular-eslint + @ngrx + Sheriff + unicorn + `eslint-plugin-commlink` + prettier, over the whole repo (`.ts` · `.html` · `.js` · `.json` · `.md`) |
| `pnpm run i18n:extract`             | rewrite **both** bundles from the `marker(...)` literals, `--clean` included (§9) |
| `pnpm run build:android`            | prod web build + `cap sync android` + `scripts/android-postsync.sh`              |
| `pnpm run apk:debug` / `apk:release`| the above + a Gradle `assemble`                                                  |
| `pnpm run sync:android` / `open:android` | the sync half alone / Android Studio                                        |

### Capacitor / Android

`appId np.afterwork.commlink`, `webDir www/browser`. Plugins: the timetracker set +
`@capacitor-mlkit/barcode-scanning` + `@capacitor/splash-screen`. The `android/` folder is
**git-ignored and regenerated on demand**: `npx cap add android` once per machine, then
`pnpm run build:android` for every rebuild. The **postsync step re-applies the edits Capacitor strips
on every sync** — the mlkit `barcode_ui` `meta-data`, the `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS`
permissions, the splash config, and the release identity (below). It is idempotent. The
generated activity `configChanges` is already the rich Capacitor-8 set.

**Release APKs are unsigned** — no `signingConfig` is wired, so `apk:release` yields
`app-release-unsigned.apk`.

**The np mark exists twice, in two formats, and the raster is the one that decides.**
`public/icons/*` (8 sizes) is the original — an `np` whose stem is a circuit tree, blue on a dark
rounded square — and is _not_ a timetracker placeholder, as this file and §12 both claimed until
2026-08-01. `public/np-logo.svg` is a vector reconstruction of it, redrawn by eye because a raster
carries no paths to convert, monochrome so it can invert; the boot splash inlines the same shapes
(§8). So changing the mark is three edits. The **wordmark** is separate and is `APP_WORDMARK`
(`@shared/model/app.consts`) — one lowercase spelling, since the deck lowercases the brand row
anyway; `<title>` in `index.html` and `name`/`short_name` in the manifest are the two copies a const
cannot reach, because both are read before any app code runs, and nothing machine-checks them.

### Release identity — `package.json`, and nothing else

**One writer for the version, three readers, no gate needed.** `package.json`'s `version` owns the
number; nothing under `src/` restates it, and nothing has to be kept in sync with it:

- **The web app** reads `APP_RELEASE` (`@shared/model/app.consts`), which is `NPC_RELEASE` injected
  by esbuild's `define` — `--define NPC_RELEASE="'$npm_package_version'"` on `build` +
  `build:pages`. `npm_package_version` is set for any `pnpm run` script, so no `node -p` is needed
  in the script and the value cannot disagree with the manifest. The ambient declaration lives in
  `src/app-release.d.ts`, which both tsconfigs already pick up via `src/**/*.d.ts`.
- **Reading it is `typeof`-guarded**, because `ng serve` and Vitest apply **no** define: there the
  identifier is genuinely undeclared and a bare reference throws `ReferenceError`. Dev therefore
  reads `dev` — honest, and it keeps the fallback path exercised instead of shipping untested. In a
  real build esbuild folds the guard away entirely (verified: `var Ji="0.1.0"` in the output, with
  the ternary and the `'dev'` literal gone).
- **The APK** derives both Gradle fields in `android-postsync.sh`: `versionName` verbatim, and
  `versionCode` as `major*10000 + minor*100 + patch` (`0.1.0` → `100`).

**Why `versionCode` is derived rather than pinned.** It is the *only* field Android compares to
decide an install is an upgrade; a code that doesn't increase is refused with
`INSTALL_FAILED_VERSION_DOWNGRADE`, and the only way in is to uninstall — which wipes the IndexedDB
holding every tracked session, the pantry and the ledger. The formula's **constraint is written into
the script**: minor and patch must each stay below 100, since `0.1.100` and `0.2.0` both compute to
`200`. That failure is silent at build time and only surfaces as an APK Android won't install.

**`APP_RELEASE` is not `APP_VERSION`.** The latter is the persisted-schema number `runMigrations`
reads (§5). They move on unrelated cadences — a release that changes no persisted shape bumps only
the former, a migration hop only the latter — so collapsing them would couple two independent
things. **Not built:** a checked-in release const plus a CI gate asserting it matches
`package.json`. Injection needs no gate because there is nothing to drift; a const would have made
`src/` restate a fact `package.json` owns and then required machinery to keep the two honest.

### The update prompt — it must ship in the first release

`@shared/util/service-worker/app-update.service.ts` wraps `SwUpdate`, publishes `updateReady` as a signal, and the
shell renders an inline `<ion-toast>` offering a reload (`applyUpdate()` → `activateUpdate()` then
`AppReloadService.reload()` — activating alone only changes what *subsequent* requests get, so a
running tab would keep the old bundle under a new worker).

**Why now, with nothing deployed yet:** a client can only be told about the next version by code
that was already in the version it is running. An updater added in v2 arrives a generation too late
for everyone it was meant to reach. (Pattern: *the upgrade mechanism ships before the thing it
upgrades* — the same shape as expand-contract migrations and telemetry clients.)

**What it does not do:** ngsw never pins a client permanently — a fresh page load activates the
newest ready version by itself. The case that never gets a fresh load is an installed PWA that is
never fully closed, and that is the whole target.

It is **inert wherever no service worker runs** (`ng serve`, specs, and the APK, whose assets are
replaced by an install): the `isEnabled` guard is the entire contract there, since `activateUpdate()`
throws when disabled. It is deliberately **not** on the `NotificationsActions.toast` contract (§3.2)
— an interactive affordance is not a message, so it carries no `toast.*` key and needs no presenter,
and rendering it declaratively keeps `ToastController` out of the shell. Its keys are `app.update.*`.
**No e2e**: proving it needs two deployed builds (same precedent as GEIST).

### CI/CD — Codeberg Forgejo Actions

`.forgejo/workflows/ci.yml`, deliberately **one job**: Codeberg's hosted runners are donated capacity
whose terms ask for minimal pipelines, so every gate (eslint · stylelint · plugin types · prettier ·
sheriff · test-ids · `tsc` ×3 · vitest coverage · playwright · prod build · pages subpath) shares one
container and one `pnpm install`, and the deploy then sits behind e2e for free instead of needing an
artifact hand-off. Twelve steps, fourteen reported gates — `docs/coding-conventions.md` §Part 1 has
the table, and that count has drifted twice by being restated in prose here.

`runs-on: codeberg-medium-lazy` — the `-lazy` suffix buys a 24 h runtime budget in exchange for a
delayed pickup (plain `codeberg-medium` caps a job at 10 min), and `medium` is the smallest tier an
Angular build fits: Codeberg counts **filesystem writes against the RAM quota**, so `node_modules` +
a Chromium download is most of a gigabyte before the compiler starts. Every `uses:` is a
**fully-qualified URL** (`https://code.forgejo.org/actions/…`) because a bare `owner/repo` resolves
against the instance's `DEFAULT_ACTIONS_URL`, which is not github.com here; contexts are the
Forgejo-native `forge.*`. No `concurrency:` block — Forgejo defaults `cancel-in-progress` to true.

**Verification runs on every push; publishing is release-gated on a `vMAJOR.MINOR.PATCH` tag.** A
push to main runs all gates and deploys nothing; pushing `v1.0.0` runs the same job again on that ref
and _then_ deploys — so Pages always serves a tree the run itself verified. Two consequences shape
the file: `on.push` carries **no filter at all**, because Forgejo rejects `branches:` and `tags:` on
the same trigger (the filter moved into the job's `if:`), and the exact semver shape is asserted by a
**`grep -Eq` in the deploy step**, not by an `on.push.tags` glob, because a glob dialect that doesn't
support what was written fails _silently_ — it just stops matching and releases quietly stop
happening. Pre-release tags (`v1.0.0-rc.1`) therefore verify without publishing.

**The PWA ships to Codeberg Pages, branch variant:**
`https://letothec0dem0nkey.codeberg.page/np-commlink/` is the tip of this repo's `pages` branch,
force-pushed as a fresh orphan commit per deploy (a publishing surface, not history — keeping the
commits would grow the repo by one full build per push). One site **per project**; the alternative —
a repo literally named `pages` — serves a single site at the domain root. Two things live in repo
settings rather than git: Actions enabled under _Units_, and a **Forgejo webhook** targeting the Pages
URL with branch filter `pages`, which is what tells the git-pages server a deploy happened. The
deploy authenticates with the automatic `forge.token`, so there is no PAT secret.

**The subpath is why there are two prod builds**, and it means **no absolute in-app URL may point at
the server root.** The two that did are fixed and are the pattern to follow: the `TranslateHttpLoader`
prefix is `'./i18n/'` (an absolute `/i18n/` 404s and every label degrades to its raw key) and
`index.html`'s favicon `href` is relative. Hash routing spares us an SPA-fallback `_redirects` file —
every route is `/#/…`, so `index.html` is the only document Pages ever serves.

**The same subpath is why the self-hosted font lives in `src/assets/`, not `public/`** (§8). A
stylesheet cannot express a base-href-relative `url()`, and all three forms were measured against a
real build:

| form in SCSS                    | outcome                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `url('/fonts/…')`               | passes through verbatim → **404s** under `/np-commlink/`          |
| `url('fonts/…')`                | **build error**, `Could not resolve` — the bundler resolves `url()` at build time, and a `public/` asset is _copied_, never bundled, so nothing exists next to the SCSS |
| `url('../assets/fonts/…')`      | fingerprinted into `media/`, emitted as `url("./media/…")` — relative to the CSS, so it survives both bases |

Only the third works, and it needs the files where the bundler can see them. It also means the woff2
ships **once**: `angular.json` copies only `public/`, so there is no second verbatim copy the way
there would be if the fonts stayed there. In the service worker they get their own **prefetch** group
in `ngsw-config.json`, ahead of the lazy `assets` group whose `woff2` pattern was matching them
before — a font cached lazily leaves the first offline launch without one.

