# Build & deployment — commands, Android, release identity, CI/CD

What still blocks the first release → [open-tasks.md](./open-tasks.md) · the gate table →
[coding-conventions.md](./coding-conventions.md).

## Commands

| Command | Does |
| --- | --- |
| `pnpm start` | dev server (`ng serve`) |
| `pnpm run build` | prod web build → `www/browser`, `--base-href ./` (for Capacitor) |
| `pnpm run build:pages` | prod web build with `--base-href /np-commlink/` (for Codeberg Pages) |
| `pnpm test` / `pnpm run e2e` | Vitest one-shot via `@angular/build:unit-test` / Playwright |
| `pnpm run lint` | `tsc -p eslint-plugin-commlink` → `ng lint` → stylelint, over the whole repo |
| `pnpm run i18n:extract` | rewrite **both** bundles from the `marker(...)` literals, `--clean` included |
| `pnpm run apk:build` | prod web build + `cap sync android` + `scripts/android-postsync.sh` |
| `pnpm run apk:debug` / `apk:release` | the above + a Gradle `assemble`; `apk:release` then collects to `releases/` |
| `pnpm run apk:signed` | `apk:release` with the four `NPC_*` values resolved for you (`scripts/sign-release.sh`) |
| `pnpm run apk:sync` / `apk:open` | the sync half alone / Android Studio |

## Capacitor / Android

`appId np.afterwork.commlink`, `webDir www/browser`. Plugins: the timetracker set +
`@capacitor-mlkit/barcode-scanning` + `@capacitor/splash-screen`. The `android/` folder is
**git-ignored and regenerated on demand**: `npx cap add android` once per machine, then
`pnpm run apk:build` for every rebuild. The **postsync step re-applies the edits Capacitor strips
on every sync** — the mlkit `barcode_ui` `meta-data`, the `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS`
permissions, the splash config, and the release identity below. It is idempotent. The generated
activity `configChanges` is already the rich Capacitor-8 set.

### Release signing — the identity is out-of-band, the wiring is in the repo

**The `signingConfig` is postsync patch 5 and holds no key material**: it reads
`NPC_KEYSTORE_PATH` / `NPC_KEYSTORE_PASSWORD` / `NPC_KEY_ALIAS` / `NPC_KEY_PASSWORD` from the
environment when Gradle configures. Three states, all verified against a real build (2026-08-02, a
throwaway key generated and destroyed for the purpose):

| env | outcome |
| --- | --- |
| none of the four set | no `signingConfig` exists — `signingReport` prints `release → Config: null`, `apk:release` yields `app-release-unsigned.apk`, `apk:debug` is untouched |
| some set | `GradleException` naming the unset variables, at configuration time |
| all four set | `app-release.apk`, `apksigner verify` reports **v2 + v3** |

**`pnpm run apk:signed` is the one command that produces one** (`scripts/sign-release.sh`): it resolves
the four values and exports them **into its own process only**, so the parent shell never sees them and
nothing outlives the build. Where each comes from, and why:

| value | source | why there |
| --- | --- | --- |
| `NPC_KEYSTORE_PATH` | the single `*.jks` / `*.keystore` in `.keystore/` | nothing to type, and two keystores is a named error rather than a coin flip |
| `NPC_KEY_ALIAS` | the variable, `.keystore/alias`, else a prompt | an alias is not a secret, so a file is fine |
| both passwords | an unechoed prompt, per build | `read -rs` neither echoes nor records, so they exist only in that process |

An empty key password means "same as the store", which is what `keytool` and Android Studio produce
unless told otherwise.

**The passwords are stored nowhere — no file, no keyring, no history — and that is the point.** A
password at rest beside the key it protects turns one copied directory into a working publisher
identity, and `.gitignore` would then be the only thing keeping *either* out of a commit. `.keystore/`
is ignored twice over here (`*.keystore` matches the directory, `*.jks` the file), but ignore rules
protect against `git add`, not against a backup, a sync client or `git clean -xdf`. Typing them a
couple of times a year is the whole cost, and a release is exactly the moment worth being sure a human
is present for. (Pattern: *the reference is versioned, the secret is injected* — same shape as patch 5
holding no key material.)

**`apk:release` then collects the APK to `releases/`, under a name that follows the signature** —
`releases/np-commlink.apk` when it is signed, `releases/np-commlink-unsigned.apk` when it is not
(`scripts/collect-apk.sh`, verified both ways on 2026-08-02 with a throwaway key). Three decisions
worth keeping:

- **The name is not fixed**, because an unsigned build must not be reachable under the name a release
  is published as. Same reasoning as the `GradleException` above: the failure mode worth spending a
  check on is a *silently* unsigned release, not a loud one.
- **The source filename comes from AGP's `output-metadata.json`, never a glob.** Both output names live
  in the same directory and neither build deletes the other, so a glob would happily pick up a stale
  APK from an earlier run in the other signing state and hand it over as the build that just happened.
  The counterpart in `releases/` is deleted for the same reason — the directory never holds two files
  claiming to be one version.
- **The `sha256` is printed**, because publishing it beside the APK is what answers "is this the
  artifact you built" for someone who did not build it (README, _Verify a release APK_).
- **A signed APK gets its signature read straight back** (`apksigner verify --verbose --print-certs`),
  because "it built" and "it is signed by the key you think" are different claims and only the second
  one an upgrade depends on. That is also where the signer SHA-256 for the README's pin comes from.
  `apksigner` is located under `ANDROID_HOME` rather than required, so a missing SDK weakens the report
  instead of failing the build.

`releases/` is git-ignored: a build output at ~28 MB a time, and the published copy is the one attached
to the tag by hand.

**Why not commit the keystore, in a repo that is AGPL and wants to be built by anyone.** Because
source openness and signing identity are orthogonal, and conflating them costs users a guarantee
instead of granting one. Android decides an APK may replace an installed one *only* by comparing
signatures, so a public key lets anyone ship a modified build that upgrades over the canonical
install and inherits its IndexedDB — every session, the pantry, the ledger — indistinguishably. AGPL
obliges conveying the corresponding **source**; the anti-Tivoization "Installation Information"
clause (GPLv3 §6) bites only where the *hardware* refuses the user's own build, which an Android
phone permitting sideloading does not. Every FOSS-Android precedent lands the same way — F-Droid,
Signal, Fennec all publish source and hold their key. (Pattern: *key material never enters the
artifact repository* — the reference is versioned, the secret is injected; same shape as a Sealed
Secret's controller key or a Cosign private key against a public registry. Corollary: a secret that
reaches git is compromised, not removable — and an app signing key cannot even be rotated away,
only abandoned.)

**What that leaves the freedom-to-build path needing: nothing.** A clone runs
`pnpm install && npx cap add android && pnpm apk:debug` with no secret, no account and no config
file, and gets a functionally identical APK under its own debug key. A fork signs with its own key by
exporting its own four values — no patch required. The README carries this as *Build it yourself*
plus the `sha256sum` + `apksigner verify --print-certs` recipe, which is what actually answers "does
this APK match this source" for someone who did not build it.

**`enableV3Signing = true` is set explicitly**, against AGP's default at `minSdk 24` (measured: v2
only, v1 correctly off since v1 is for pre-24 devices). v3 carries the proof-of-rotation lineage, and
an APK first published *without* it can never be rotated afterwards — so it has to be on from the
first release, which is the only moment the choice is still available. It is not a substitute for
backing the key up: rotation still has to be signed by the old key, and only SDK 28+ honours the
lineage.

**Patch 5 is replaced, not skipped-if-present.** The other four patches are guarded by
"already there?" tests, which is right for them — they restore something Capacitor removed. This one
is the script's *own* content, so an append-if-absent guard would make an edit here reach only
freshly generated `android/` folders and silently miss the machine it was written on. It is therefore
cut back to its marker and re-appended every run. (Same family as *a green suite does not verify a
config change*: the inert-guard failure mode is silence.)

**CI is deliberately not given the key.** `.forgejo/workflows/ci.yml` builds no APK; release APKs are
built locally and attached by hand. Nothing about the pipeline needs a signing secret, so it does not
have one — and a base64 keystore in a repo secret is a decision to defer until an APK build in CI is
actually wanted.

**The np mark exists twice, in two formats, and the raster is the one that decides.** `public/icons/*`
(8 sizes) is the original — an `np` whose stem is a circuit tree, blue on a dark rounded square — and
is _not_ a timetracker placeholder, as this file claimed until 2026-08-01. `public/np-logo.svg` is a
vector reconstruction, redrawn by eye because a raster carries no paths to convert, monochrome so it
can invert; the boot splash inlines the same shapes. So changing the mark is three edits. The
**wordmark** is separate and is `APP_WORDMARK` (`@shared/model/app.consts`) — one lowercase spelling,
since the deck lowercases the brand row anyway. `<title>` in `index.html` and `name`/`short_name` in
the manifest are the two copies a const cannot reach, both being read before any app code runs, and
nothing machine-checks them.

## Release identity — `package.json`, and nothing else

**One writer for the version, three readers, no gate needed.** `package.json`'s `version` owns the
number; nothing under `src/` restates it:

- **The web app** reads `APP_RELEASE` (`@shared/model/app.consts`), which is `NPC_RELEASE` injected by
  esbuild's `define` — `--define NPC_RELEASE="'$npm_package_version'"` on `build` + `build:pages`.
  `npm_package_version` is set for any `pnpm run` script, so no `node -p` is needed and the value
  cannot disagree with the manifest. The ambient declaration is `src/app-release.d.ts`, which both
  tsconfigs pick up via `src/**/*.d.ts`.
- **Reading it is `typeof`-guarded**, because `ng serve` and Vitest apply **no** define: there the
  identifier is genuinely undeclared and a bare reference throws `ReferenceError`. Dev therefore reads
  `dev` — honest, and it keeps the fallback exercised instead of shipping untested. In a real build
  esbuild folds the guard away entirely (verified: `var Ji="0.1.0"` in the output).
- **The APK** derives both Gradle fields in `android-postsync.sh`: `versionName` verbatim,
  `versionCode` as `major*10000 + minor*100 + patch` (`0.1.0` → `100`).

**Why `versionCode` is derived rather than pinned.** It is the *only* field Android compares to decide
an install is an upgrade; a code that doesn't increase is refused with
`INSTALL_FAILED_VERSION_DOWNGRADE`, and the only way in is to uninstall — which wipes the IndexedDB
holding every tracked session, the pantry and the ledger. The formula's **constraint is written into
the script**: minor and patch must each stay below 100, since `0.1.100` and `0.2.0` both compute to
`200`. That failure is silent at build time and only surfaces as an APK Android won't install.

**`APP_RELEASE` is not `APP_VERSION`** — the latter is the persisted-schema number `runMigrations`
reads. They move on unrelated cadences, so collapsing them would couple two independent things.
**Not built:** a checked-in release const plus a CI gate asserting it matches `package.json`.
Injection needs no gate because there is nothing to drift.

## Install identity — `manifest.id`, settable only before the first install

`public/manifest.webmanifest` declares **`"id": "np-commlink"`**, while `scope` and `start_url` stay
relative (`./`) so both prod builds keep working. Three things make it worth declaring rather than
leaving implicit:

- **Omitted, identity falls back to `start_url`.** Declaring an `id` that differs from the identity a
  client already installed under makes the browser see a **second app**: a fresh install beside the old
  one, with its own IndexedDB and no route to the first one's data. Nothing is published yet, so the
  value is a free choice **now** and frozen afterwards — the point of declaring it is that `start_url`
  and the deploy path can then move without the identity moving with them.
- **`id` is parsed as a URL against the *origin*, not against the manifest URL.** So `"np-commlink"`
  resolves to `https://…codeberg.page/np-commlink` — a trailing slash or a leading one would be a
  *different* identity string, which is why the value gets written once and never touched. It only has
  to be same-origin and unique per origin; it is compared for equality, never navigated, and needs no
  relationship to `scope`.
- **One site per project, but one _origin_ for all of them.** The branch variant gives each project its
  own **path** — `letothec0dem0nkey.codeberg.page/<repo>/` — and Codeberg publishes no per-repo
  subdomain, so the host is shared by every project of this account (verified against
  `docs.codeberg.org/codeberg-pages`, 2026-08-02: the only two forms are `username.codeberg.page/` for a
  repo named `pages` and `username.codeberg.page/repository-name/` for a `pages` branch). A relative
  `"./"` — collapsing to `/` — would therefore be the same identity for all of them. The same sharing is
  why the storage names are namespaced (DB `np-commlink`, store `npCommlink`, keys `npc-*`): IndexedDB
  and localStorage are **origin**-scoped, and a path prefix is not part of an origin. The service worker
  is the exception that proves it — registration scope _is_ path-restricted, so those cannot collide.

Capacitor ignores the web manifest entirely, so this costs the APK nothing.

> **Pattern — identity fields are immutable after first publish.** `manifest.id`, the signing
> certificate, `versionCode` and `enableV3Signing` are all fields a distribution channel compares to
> decide *same app or different app*, and the first artifact that reaches a user freezes every one of
> them. The window to choose is only open before the first release.

## The update prompt — it must ship in the first release

`@shared/util/service-worker/app-update.service.ts` wraps `SwUpdate`, publishes `updateReady` as a
signal, and the shell renders an inline `<ion-toast>` offering a reload (`applyUpdate()` →
`activateUpdate()` then `AppReloadService.reload()` — activating alone only changes what *subsequent*
requests get, so a running tab would keep the old bundle under a new worker).

**Why now, with nothing deployed yet:** a client can only be told about the next version by code that
was already in the version it is running. An updater added in v2 arrives a generation too late for
everyone it was meant to reach.

> **Pattern — the upgrade mechanism ships before the thing it upgrades.** Same shape as
> expand-contract migrations and telemetry clients.

**What it does not do:** ngsw never pins a client permanently — a fresh page load activates the newest
ready version by itself. The case that never gets a fresh load is an installed PWA that is never fully
closed, and that is the whole target.

It is **inert wherever no service worker runs** (`ng serve`, specs, and the APK, whose assets are
replaced by an install): the `isEnabled` guard is the entire contract there, since `activateUpdate()`
throws when disabled. It is deliberately **not** on the `NotificationsActions.toast` contract — an
interactive affordance is not a message, so it carries no `toast.*` key and needs no presenter, and
rendering it declaratively keeps `ToastController` out of the shell. **No e2e**: proving it needs two
deployed builds.

## CI/CD — Codeberg Forgejo Actions

`.forgejo/workflows/ci.yml`, deliberately **one job**: Codeberg's hosted runners are donated capacity
whose terms ask for minimal pipelines, so every gate shares one container and one `pnpm install`, and
the deploy then sits behind e2e for free instead of needing an artifact hand-off. The step and gate
counts live in [coding-conventions.md](./coding-conventions.md) and are deliberately not restated
here — that count drifted twice by being kept in two places.

`runs-on: codeberg-medium-lazy` — the `-lazy` suffix buys a 24 h runtime budget in exchange for a
delayed pickup (plain `codeberg-medium` caps a job at 10 min), and `medium` is the smallest tier an
Angular build fits: Codeberg counts **filesystem writes against the RAM quota**, so `node_modules` + a
Chromium download is most of a gigabyte before the compiler starts. Every `uses:` is a
**fully-qualified URL** (`https://code.forgejo.org/actions/…`) because a bare `owner/repo` resolves
against the instance's `DEFAULT_ACTIONS_URL`, which is not github.com here; contexts are the
Forgejo-native `forge.*`. No `concurrency:` block — Forgejo defaults `cancel-in-progress` to true.

**Verification runs on every push; publishing is release-gated on a `vMAJOR.MINOR.PATCH` tag.** A push
to main runs all gates and deploys nothing; pushing `v1.0.0` runs the same job again on that ref and
_then_ deploys — so Pages always serves a tree the run itself verified. Two consequences shape the
file: `on.push` carries **no filter at all**, because Forgejo rejects `branches:` and `tags:` on the
same trigger (the filter moved into the job's `if:`), and the exact semver shape is asserted by a
**`grep -Eq` in the deploy step**, not by an `on.push.tags` glob, because a glob dialect that doesn't
support what was written fails _silently_ — it just stops matching and releases quietly stop
happening. Pre-release tags (`v1.0.0-rc.1`) therefore verify without publishing.

**The PWA ships to Codeberg Pages, branch variant:**
`https://letothec0dem0nkey.codeberg.page/np-commlink/` is the tip of this repo's `pages` branch,
force-pushed as a fresh orphan commit per deploy (a publishing surface, not history — keeping the
commits would grow the repo by one full build per push). One site **per project**; the alternative, a
repo literally named `pages`, serves a single site at the domain root. Two things live in repo
settings rather than git: Actions enabled under _Units_, and a **Forgejo webhook** targeting the Pages
URL with branch filter `pages`, which is what tells the git-pages server a deploy happened. The deploy
authenticates with the automatic `forge.token`, so there is no PAT secret.

**The subpath is why there are two prod builds**, and it means **no absolute in-app URL may point at
the server root.** The two that did are fixed and are the pattern to follow: the `TranslateHttpLoader`
prefix is `'./i18n/'` (an absolute `/i18n/` 404s and every label degrades to its raw key) and
`index.html`'s favicon `href` is relative. Hash routing spares us an SPA-fallback `_redirects` file —
every route is `/#/…`, so `index.html` is the only document Pages ever serves.

**The same subpath is why the self-hosted font lives in `src/assets/`, not `public/`.** A stylesheet
cannot express a base-href-relative `url()`, and all three forms were measured against a real build:

| form in SCSS | outcome |
| --- | --- |
| `url('/fonts/…')` | passes through verbatim → **404s** under `/np-commlink/` |
| `url('fonts/…')` | **build error**, `Could not resolve` — the bundler resolves `url()` at build time, and a `public/` asset is _copied_, never bundled, so nothing exists next to the SCSS |
| `url('../assets/fonts/…')` | fingerprinted into `media/`, emitted as `url("./media/…")` — relative to the CSS, so it survives both bases |

Only the third works, and it needs the files where the bundler can see them. It also means the woff2
ships **once**: `angular.json` copies only `public/`, so there is no second verbatim copy. In the
service worker they get their own **prefetch** group in `ngsw-config.json`, ahead of the lazy `assets`
group whose `woff2` pattern was matching them before — a font cached lazily leaves the first offline
launch without one.
