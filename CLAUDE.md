# CLAUDE.md

Working guide for Claude Code (claude.ai/code) in this repository. **This file is the operating
manual: what to run, what not to break, and where the reasoning lives.** It deliberately does not
restate that reasoning — [docs/project-summary.md](docs/project-summary.md) indexes the compendium,
one file per seam, and the git log carries the decision history.

## Project

`np-commlink` — Ionic 8 + Angular 21 (standalone, zoneless) + Capacitor 8. The **merge of two apps**:
`np-timetracker` (time/office tracking, the structural and visual base) and `np-kitchen-bot`
(groceries / storage / tasks), grafted in as independent features under one Shadowrun cyberdeck skin.
No backend — all state is local (NgRx in memory, `@ionic/storage` on disk). Ships as a PWA and an
Android APK.

**Trunk-based: work on `main`.** If you must isolate, prefer a worktree over a branch and keep up with
main. Commit messages explain the *why*.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm start` | dev server (`ng serve`) |
| `pnpm run build` | prod web build → `www/browser`, `--base-href ./` (Capacitor) |
| `pnpm run build:pages` | prod build with `--base-href /np-commlink/` (Codeberg Pages) |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest via `@angular/build:unit-test` |
| `pnpm run e2e` | Playwright (`e2e/`, port 4321) |
| `pnpm run lint` | plugin types → eslint → stylelint, whole repo |
| `pnpm run verify:all` | every gate, as sixteen reported cards (~90 s cold) |
| `pnpm run verify:testids` · `:icons` · `:docs` · `:exports` · `:pages` | the five whole-repo scripts |
| `pnpm exec sheriff verify src/main.ts` | module boundaries |
| `pnpm run i18n:extract` | rewrite both bundles from the `marker(...)` literals, `--clean` included |
| `pnpm run emoji:build` | regenerate the emoji catalog from CLDR (output is committed; run on a dependency bump, not in CI) |
| `pnpm run apk:build` | web build + `cap sync android` + postsync patches |
| `pnpm run apk:debug` / `apk:release` / `apk:open` | Gradle assemble (release collects to `releases/`) / Android Studio |
| `pnpm run apk:signed` | `apk:release` with the signing identity resolved — keystore found, passwords prompted |

`android/` is git-ignored and regenerated: `npx cap add android` once per machine.
Full rationale for the build and release commands: [docs/build-and-deploy.md](docs/build-and-deploy.md).

## Hard rules

Each names what enforces it and where it is argued. **A rule with a gate needs no vigilance — the
gate is the documentation.** The ones without a gate are the ones to hold in your head.

| Rule | Enforced by | Argued in |
| --- | --- | --- |
| No `@ngrx/*` outside `data/` — every read and dispatch goes through a `<Domain>Facade` | `commlink/ngrx-data-layer-only` | [architecture.md](docs/architecture.md) |
| Domains are sealed; no feature imports another feature | Sheriff (`domain:* → sameTag, domain:shared`) | [architecture.md](docs/architecture.md) |
| `smart-ui` is a strict leaf — a smart component never composes another | Sheriff type axis | [architecture.md](docs/architecture.md) |
| The only `index.ts` is a `<domain>/data/` facade barrel | `commlink/no-barrel-outside-data` | [architecture.md](docs/architecture.md) |
| Never compose an i18n key at the call site — a composed key is invisible to `--clean` and gets pruned | `commlink/marker-argument-is-literal`, `instant-argument-is-marker` | [i18n.md](docs/i18n.md) |
| Never compose a `data-testid`; an `app-*` element is already a contract | `commlink/testid-is-static`, `no-testid-on-component-element`, `verify:testids` | [coding-conventions.md](docs/coding-conventions.md) |
| Action-group event keys are camelCase identifiers, and nothing matches on the type string | `commlink/action-event-keys-are-identifiers`, `no-action-type-literal` | [architecture.md](docs/architecture.md) |
| At most one comment per file — a `why` banner above the first code token | `commlink/comments-header-only` | [coding-conventions.md](docs/coding-conventions.md) |
| Every `ion-icon`, icon-only control, form control and overlay carries its own name (R1–R9) | eight `commlink/a11y-*` rules | [ionic-a11y-practices.md](docs/ionic-a11y-practices.md) |
| Every `ion-icon` name is registered with `addIcons` by the component that renders it — an unregistered name is an invisible control, not an error | `verify:icons` | [coding-conventions.md](docs/coding-conventions.md) |
| `@shared` speaks no domain vocabulary | `commlink/i18n-key-ownership` | [i18n.md](docs/i18n.md) |
| Muted text is `var(--sr-text-dim)`, never the accent at an alpha | `commlink/muted-text-uses-token` | `src/theme/_shadowrun.scss` |
| A spec calling `overrideSelector` also calls `resetSelectors` | `commlink/spec-resets-mock-selectors` | [testing.md](docs/testing.md) |
| **Speaking code, not comments** — extract the block instead of explaining it | review | [coding-conventions.md](docs/coding-conventions.md) |
| **No `I`/`T` prefix on a type** (`BaseItem`, not `IBaseItem`); a generic *parameter* keeps its `T` | review | [coding-conventions.md](docs/coding-conventions.md) |
| **Retheme the CSS custom properties** — never restyle components one by one | review | `src/global.scss` |
| **Lean tests, not exhaustive** — no 100% target, no branded-type machinery | review | [testing.md](docs/testing.md) |

## Before you touch X, read Y

| If you are about to… | Read |
| --- | --- |
| let one feature use another | [cross-feature-communication.md](docs/cross-feature-communication.md) — **first, always** |
| add a slice, a context, a persisted key or a migration | [lifecycle-and-persistence.md](docs/lifecycle-and-persistence.md) |
| add a page, a route or a domain folder | [architecture.md](docs/architecture.md) |
| add or change a dialog / a form | [dialogs-and-forms.md](docs/dialogs-and-forms.md) |
| add a translation key family | [i18n.md](docs/i18n.md) |
| add a theme, or style anything | `src/global.scss`, then [theming.md](docs/theming.md) |
| write a spec, especially e2e | [testing.md](docs/testing.md) — the five locator traps |
| add or change a lint gate | [coding-conventions.md](docs/coding-conventions.md) — upstream rule, then own rule, then script |
| touch the household subsystem | [features.md](docs/features.md), then [lifecycle-and-persistence.md](docs/lifecycle-and-persistence.md) |
| touch cash | [cash.md](docs/cash.md) |
| touch the deck grid or the side menu | [deck-catalog.md](docs/deck-catalog.md) — one catalog behind both |
| propose work, or clear "what's left" | [open-tasks.md](docs/open-tasks.md) — most of what looks undone is blocked or declined on purpose, and [decisions.md](docs/decisions.md) says which |

## Four traps that cost a red suite every time

Named here because each is cheap to re-introduce and expensive to diagnose. The reasoning is one
click away in each case.

- **Lazy ≠ unloaded.** `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx has no per-injector
  teardown, so a lazy route's injector, effects and state register on **first visit and persist for
  the session**. Modules are not mutually exclusive. "Lazy" here is a boot-cost win, not memory
  reclaim. → [lifecycle-and-persistence.md](docs/lifecycle-and-persistence.md)
- **An `<ion-modal>` teleports to the app root**, so it is outside its page's scope, and a single list
  route mounts five of them. Key a presented dialog off its **title**, never its wrapper. Four more
  Ionic locator traps sit beside it. → [testing.md](docs/testing.md)
- **Composing an identifier at the call site** breaks the tool that reads it — an i18n key gets pruned
  by `--clean`, a `data-testid` drops out of the declared set. Both halves must share one literal.
  → [coding-conventions.md](docs/coding-conventions.md)
- **A green suite does not verify a config change.** A dropped rule option makes a gate inert, and
  inert gates pass. Check with `eslint --print-config <file>`.
  → [coding-conventions.md](docs/coding-conventions.md)

## Testing shape

Three layers, lean by design (`docs/testing.md` has the reasoning and the worked examples):

- **Vitest, pure logic** (`*.spec.ts`) — utils, pipes, reducers, selectors via `.projector(...)`. No
  `TestBed` where a plain call suffices.
- **Vitest, component class logic** — `TestBed.createComponent(...).componentInstance` +
  `provideMockStore()` + `provideZonelessChangeDetection()`. Whether `detectChanges()` is allowed
  depends on what the template embeds: jsdom never upgrades a Stencil element, so a dumb component may
  call it and assert its own light DOM, while a page embedding Ionic-heavy children must not.
- **Playwright e2e** — real-browser behaviour. Two projects partitioned by path, not a matrix:
  `mobile-chromium` (an emulated Pixel 5) runs everything except `e2e/desktop/**`.

Shared test infra is `src/app/@shared/testing/` (Sheriff `type:testing`, reachable only from
`*.spec.ts`). Effects stay RxJS. Rely on Vitest `globals: true` — do not `import` a *value* from
`'vitest'` (`import type` is fine, and needed for `MockInstance`).

## Never read secrets

Never open the contents of any credential, key, certificate, or otherwise secret-bearing file — no
`Read`, `cat`, grep-with-content, or inclusion in a diff. A filename alone is not proof a file is
safe. To learn which keys exist, **read the loading code, not the file.**

`docs/cash/*.csv` is gitignored for this reason: the two files that lived there were real giro
exports and were purged from all 347 commits carrying them ([decisions.md](docs/decisions.md)).
