# CLAUDE.md

Operating manual for Claude Code in this repository: what to run, and what not to break.

`np-commlink` — Ionic 8 + Angular 21 (standalone, zoneless) + Capacitor 8. The **merge of two apps**:
`np-timetracker` (time/office tracking, the structural and visual base) and `np-kitchen-bot`
(groceries / storage / tasks), grafted in as independent features under one Shadowrun cyberdeck skin.
No backend — all state is local (NgRx in memory, `@ionic/storage` on disk). Ships as a PWA and an
Android APK.

**Trunk-based: work on `main`.** If you must isolate, prefer a worktree over a branch. Commit messages
explain the *why* — the git log is the decision record.

## Three documents, and the rule that keeps them small

| File | Holds |
| --- | --- |
| [decisions.md](docs/decisions.md) | settled questions, so they are not re-flagged as work. **Append; never re-weave.** |
| [footguns.md](docs/footguns.md) | empirical failures that do not reproduce from a read of the source |
| [state.md](docs/state.md) | blocked work, one-way doors, what waits on upstream |

**Update a doc only when a decision, a footgun, or a one-way door changes — never as a follow-up to a
code change.** An inventory that mirrors the tree has to be rewritten every time the tree moves, so
this repo keeps none: the gate list is `GATES=(` in `scripts/verify-all.sh`, the boundaries are
`sheriff.config.ts`, the compiler flags are `tsconfig.json`, the budgets and coverage floors are
`angular.json`, the CI steps are `.forgejo/workflows/ci.yml`, the style layer's contract is
`src/global.scss`'s own banner, and each lint rule's rationale is its own file's banner. None of those
can drift from itself.

A prose compendium of thirteen further files was deleted on 2026-08-04 as unread overhead. Every
measurement it carried is either in the three files above or one command away:
`git show HEAD~1:docs/<name>.md` — `architecture`, `testing`, `lifecycle-and-persistence`,
`coding-conventions`, `cross-feature-communication`, `i18n`, `build-and-deploy`, `theming`,
`dialogs-and-forms`, `features`, `cash`, `deck-catalog`, `ionic-a11y-practices`, `project-summary`,
`patterns`, `open-tasks`.

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
| `pnpm run emoji:build` | regenerate the emoji catalog from CLDR (output is committed; not in CI) |
| `pnpm run apk:build` | web build + `cap sync android` + postsync patches |
| `pnpm run apk:debug` / `apk:release` / `apk:open` | Gradle assemble (release collects to `releases/`) / Android Studio |
| `pnpm run apk:signed` | `apk:release` with the signing identity resolved — keystore found, passwords prompted |

`android/` is git-ignored and regenerated: `npx cap add android` once per machine.

## Hard rules

**A rule with a gate needs no vigilance — the gate is the documentation.** When one fires, its own file
banner says why. The ones without a gate are the ones to hold in your head.

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
| Every `ion-icon`, icon-only control, form control and overlay carries its own name (R1–R9) | eight `commlink/a11y-*` rules |
| Every `ion-icon` name is registered with `addIcons` by the component that renders it — an unregistered name is an invisible control, not an error | `verify:icons` |
| `@shared` speaks no domain vocabulary | `commlink/i18n-key-ownership` |
| Muted text is `var(--sr-text-dim)`, never the accent at an alpha | `commlink/muted-text-uses-token` |
| A spec calling `overrideSelector` also calls `resetSelectors` | `commlink/spec-resets-mock-selectors` |
| **Speaking code, not comments** — extract the block instead of explaining it | review |
| **No `I`/`T` prefix on a type** (`BaseItem`, not `IBaseItem`); a generic *parameter* keeps its `T` | review |
| **Retheme the CSS custom properties** — never restyle components one by one | review |
| **Lean tests, not exhaustive** — no 100% target, no branded-type machinery | review |
| **R5 and R9 can never be gated** — a gesture is never the only way; the viewport never locks zoom | review |

Adding a gate, in order: **an upstream rule configured**, then **a rule in `eslint-plugin-commlink/`**,
then **a script** — the last only for what ESLint structurally cannot see (a whole-repo set difference,
or a question about the filesystem rather than a file's bytes). Read
[footguns.md](docs/footguns.md) first: several ways a new gate goes silently inert are recorded there.

## Testing shape

Three layers, lean by design. The traps in each are in [footguns.md](docs/footguns.md).

- **Vitest, pure logic** (`*.spec.ts`) — utils, pipes, reducers, selectors via `.projector(...)`. No
  `TestBed` where a plain call suffices.
- **Vitest, component class logic** — `TestBed.createComponent(...).componentInstance` +
  `provideMockStore()` + `provideZonelessChangeDetection()`. Whether `detectChanges()` is allowed
  depends on what the template embeds.
- **Playwright e2e** — real-browser behaviour. Two projects partitioned by path, not a matrix:
  `mobile-chromium` (an emulated Pixel 5) runs everything except `e2e/desktop/**`.

Shared test infra is `src/app/@shared/testing/` (Sheriff `type:testing`, reachable only from
`*.spec.ts`). Effects stay RxJS.

## Never read secrets

Never open the contents of any credential, key, certificate, or otherwise secret-bearing file — no
`Read`, `cat`, grep-with-content, or inclusion in a diff. A filename alone is not proof a file is
safe. To learn which keys exist, **read the loading code, not the file.**

`docs/cash/*.csv` is gitignored for this reason: the two files that lived there were real giro
exports and were purged from all 347 commits carrying them ([decisions.md](docs/decisions.md)).
