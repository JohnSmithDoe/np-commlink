# CLAUDE.md

Operating manual for Claude Code in this repository: what to run, and what not to break.

`np-commlink` — Ionic 8 + Angular 21 (standalone, zoneless) + Capacitor 8. The **merge of two apps**:
`np-timetracker` (time/office tracking, the structural and visual base) and `np-kitchen-bot`
(groceries / storage / tasks), grafted in as independent features under one Shadowrun cyberdeck skin.
No backend — all state is local (NgRx in memory, `@ionic/storage` on disk). Ships as a PWA and an
Android APK.

**Keep comments to a minimum**, speaking human readable code first. no history, no war stories, max one header comment see below

**Trunk-based: work on `main`.** If you must isolate, prefer a worktree over a branch. Commit messages
explain the *why*. The log is not a source to read back — it is squashed into chapters — so anything
that has to outlive its commit belongs in one of the five documents below.

## Five documents, and the rule that keeps them small

| File | Holds |
| --- | --- |
| [decisions.md](docs/decisions.md) | settled questions that CROSS domains, so they are not re-flagged as work |
| [domains.md](docs/domains.md) | one module's own settled reasoning — CREDSTICK, BIOMON, DAILY RUN, SIGIL, SOYKAF, the deck |
| [footguns.md](docs/footguns.md) | empirical failures that do not reproduce from a read of the source |
| [state.md](docs/state.md) | blocked work, one-way doors, open defects, costs left standing |
| [next-version.md](docs/next-version.md) | work triaged into the next major |

**These five are the whole list.** A doc is updated only when a decision, a footgun, a one-way door or
the next version's scope changes — **never as a follow-up to a code change**. Write the current state,
not the story that reached it: **append while a decision stands, collapse it into its successor once
one supersedes it**, and drop an entry outright once the code says it. `state.md` holds what is
BLOCKED and `next-version.md` what is SCHEDULED — nothing belongs in both.

An inventory that mirrors the tree needs rewriting every time the tree moves, so this repo keeps none.
Each fact lives where it cannot drift from itself: gates in `scripts/verify-all.sh` (`GATES=(`),
boundaries in `sheriff.config.ts`, compiler flags in `tsconfig.json`, budgets and coverage floors in
`angular.json`, the publish pipeline in `.github/workflows/release.yml`, the style layer's contract in
`src/global.scss`'s banner, each lint rule's rationale in its own.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm start` | dev server (`ng serve`) |
| `pnpm run build` | prod web build → `www/browser`, `--base-href ./` (Capacitor) |
| `pnpm run build:pages` | prod build with `--base-href /np-commlink/` (GitHub Pages) |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest via `@angular/build:unit-test` |
| `pnpm run test:plugin` | Vitest over `eslint-plugin-commlink/`'s RuleTester specs — its own config, because the builder's tsconfig reaches only under `src` |
| `pnpm run e2e` | Playwright (`e2e/`, port 4321) |
| `pnpm run lint` | plugin types → eslint → stylelint, whole repo |
| `pnpm run verify:all` | every gate, one reported card each; `--cold` purges eslint's cache |
| `pnpm run verify:testids` · `:icons` · `:docs` · `:exports` · `:pages` | the whole-repo scripts |
| `pnpm exec sheriff verify src/main.ts` | module boundaries |
| `pnpm run i18n:extract` | rewrite both bundles from the `marker(...)` literals, `--clean` included |
| `pnpm run emoji:build` | regenerate the emoji catalog from CLDR (output is committed; not in CI) |
| `pnpm run handbook:shots` | the whole figure pipeline: shoot, convert to WebP, clear the stale flags (release only — see below) |
| `pnpm run apk:build` | web build + `cap sync android` + postsync patches |
| `pnpm run apk:debug` / `apk:release` / `apk:open` | Gradle assemble (release collects to `releases/`) / Android Studio |
| `pnpm run apk:signed` | `apk:release` with the signing identity resolved — keystore found, passwords prompted |

**`verify:all` is a pre-commit gate, not a per-edit check** — it includes a production build and the
whole Playwright run, ~90 s where the answer usually costs four. Match the check to the blast radius:
`pnpm test` for a spec or logic edit, `pnpm run lint` for a lint-shaped one, `pnpm run build` for
anything a template or AOT catches.

**Never regenerate the handbook.** `e2e/handbook/*.shots.ts` runs under its own
`playwright.handbook.config.ts`, outside `verify:all` — the screenshots are regenerated **on release
only, by Martin**. Keep the shots *source* in step by hand when a selector it reads changes, and stop
there; never run that config to check your edit.

**Instead, mark what your change made stale**: set `"shotsStale": true` on each
`public/handbook/pages/*.json` showing a screen you changed, and the article paints a warning above
itself. No gate can see this; [state.md](docs/state.md) carries which pages are flagged.

**The release run is one command:** `pnpm run handbook:shots`
(`scripts/build-handbook-shots.mjs`) shoots every figure, converts each 786×1454 PNG to the committed
620px WebP with `cwebp`, and drops `"shotsStale"` from every page whose figures were **all** refreshed
— naming the ones it left flagged. `--skip-shots` re-converts the last run. Needs `cwebp` on PATH
(`brew install webp`) and a clean tree: the suite drives the real app, so an edit landing mid-run
yields a figure set half old and half new.

`android/` is **committed** — `cap add` is not reproducible across Capacitor versions, so the native
project is source. `android/.gitignore` (shipped by Capacitor) excludes the generated half. Never
hand-edit what `scripts/android-postsync.sh` writes; add a patch there instead.

## Hard rules

**A rule with a gate needs no vigilance — the gate is the documentation**, and the rule's own file
banner says why it fires. Hold the ungated ones in your head.

| Rule | Enforced by |
| --- | --- |
| No `@ngrx/*` outside `data/` — every read and dispatch goes through a `<Domain>Facade` | `commlink/ngrx-data-layer-only` |
| Domains are sealed; no feature imports another feature | Sheriff (`domain:* → sameTag, domain:shared`) |
| No `@Injectable` in any `util/` — every service lives in `data/`, so `ui → util` stays inert | `no-restricted-syntax` (eslint.config.js) |
| `smart-ui` is a strict leaf — a smart component never composes another | Sheriff type axis |
| The only `index.ts` is a `<domain>/data/` facade barrel | `commlink/no-barrel-outside-data` |
| Never compose an i18n key at the call site | `commlink/marker-argument-is-literal`, `instant-argument-is-marker` |
| Never compose a `data-testid`; an `app-*` element is already a contract | `commlink/testid-is-static`, `no-testid-on-component-element`, `verify:testids` |
| Action-group event keys are camelCase identifiers, and nothing matches on the type string | `commlink/action-event-keys-are-identifiers`, `no-action-type-literal` |
| At most one comment per file — a `why` banner above the first code token | `commlink/comments-header-only` |
| **A banner is the exception, not the header** — write none unless the code cannot say it, then 6–14 lines ([decisions.md](docs/decisions.md)); 32 is the gate | review |
| Every `ion-icon`, icon-only control, form control and overlay carries its own name (R1–R9) | eight `commlink/a11y-*` rules |
| Every `ion-icon` name is registered with `addIcons` by the component that renders it — an unregistered name is an invisible control, not an error | `verify:icons` |
| Icon weight follows position — a control is `-outline`, a `[leadingIcon]` subject is filled; a filled CONTROL needs a `FILLED_BY_DESIGN` entry saying what its fill MEANS | `verify:icons` |
| `@shared` uses no domain-owned **i18n key** — it owns no wording | `commlink/i18n-key-ownership` |
| Muted text is `var(--sr-text-dim)`, never the accent at an alpha | `commlink/muted-text-uses-token` |
| A spec calling `overrideSelector` also calls `resetSelectors` | `commlink/spec-resets-mock-selectors` |
| **Speaking code, not comments** — extract the block instead of explaining it | review |
| **No `I`/`T` prefix on a type** (`BaseItem`, not `IBaseItem`); a generic *parameter* keeps its `T` | review |
| **Retheme the CSS custom properties** — never restyle components one by one | review |
| **Lean tests, not exhaustive** — no 100% target, no branded-type machinery | review |
| **R5 and R9 can never be gated** — a gesture is never the only way; the viewport never locks zoom | review |
| **A persisted shape, key or entry id changes only after asking whether a rung is owed** | ask — *Stored shapes* below |

**`@shared` does hold domain-named code, and that is the design.** The rule above governs *wording*
only. `@shared/data/actions/` carries `NotificationsActions` and `DashboardActions`, `@shared/model/`
the types they move: that is the **cross-domain event bus**, and it is what makes sealed domains
workable — `tracking` tells the inbox a timer is running by dispatching a `@shared` action, never by
importing `notifications`. Sheriff permits `domain:* → domain:@shared` for every domain, so the
discipline is yours: a contract two domains must agree on goes in `@shared`; a fact one domain owns
does not.

Adding a gate, in order: **an upstream rule configured**, then **a rule in `eslint-plugin-commlink/`**,
then **a script** — the last only for what ESLint cannot see (a whole-repo set difference, or a
question about the filesystem rather than a file's bytes). Read [footguns.md](docs/footguns.md) first:
it records several ways a new gate goes silently inert.

## Stored shapes, and who is holding one

**Ask before changing a persisted shape — never decide it from the code.** Whether a rung is owed turns
on who is running the app, which is a fact only Martin has: not the tag, not "it is only additive", not
that `runMigrations` would walk past a missing step. Ask when a field is dropped or renamed, when a
persisted key or a deck entry id moves, and before `APP_VERSION` is bumped.

Real users currently hold **`ritual` (DAILY RUN), `household` and `tasks` (AGENDA), and `vitals`
(BIOMON)**, plus `deck` and `settings` by construction — a cold deck ships empty, so reaching those
three means having switched programs on. Every other slice — `cash`, `tracking`, `officeTime`,
`trackplay`, `notes`, `notifications`, `dashboard` — is dev-only, and its shape changes for the price
of a cleared browser. The user base is small enough that most changes are still free, which is what
makes the question worth asking rather than assuming, in either direction. What a rung owes, and what
has shipped without one, is in [decisions.md](docs/decisions.md) and [state.md](docs/state.md).

## Testing shape

Three layers, lean by design. The traps in each are in [footguns.md](docs/footguns.md). Shared infra
is `src/app/@shared/testing/` (Sheriff `type:testing`, reachable only from `*.spec.ts`); effects stay
RxJS.

- **Vitest, pure logic** (`*.spec.ts`) — utils, pipes, reducers, selectors via `.projector(...)`. No
  `TestBed` where a plain call suffices.
- **Vitest, component class logic** — `TestBed.createComponent(...).componentInstance` +
  `provideMockStore()` + `provideZonelessChangeDetection()`. Whether `detectChanges()` is allowed
  depends on what the template embeds.
- **Playwright e2e** — real-browser behaviour. Two projects partitioned by path, not a matrix:
  `mobile-chromium` (an emulated Pixel 5) runs everything except `e2e/desktop/**`.
