# np-commlink — project summary

The index of this repo's compendium: what the app is, and where the reasoning behind every seam
lives. [CLAUDE.md](../CLAUDE.md) is the operating manual — what to run and what not to break; these
documents are the argument behind it. Design history (the two-app merge, the DDD re-domaining, the
lazy cutover, the sheriff tightening, the comment sweep) is in the git log.

## Where to look

| File | What is in it |
| --- | --- |
| this file | what the app is + the module map |
| [architecture.md](./architecture.md) | the two forces (sealed contexts × laziness), folder layout, Sheriff dep rules, routing, NgRx behind per-domain facades |
| [dialogs-and-forms.md](./dialogs-and-forms.md) | why dialog state left the store, the two dialog bases, Signal Forms, the shared form rules, the emoji picker |
| [cross-feature-communication.md](./cross-feature-communication.md) | **the five channels** any cross-feature interaction must use, the two inverted capabilities, the context map |
| [lifecycle-and-persistence.md](./lifecycle-and-persistence.md) | what boots vs what registers per route, the global error boundary, `providePersistedContext`, the list-flow builders, **lazy ≠ unloaded**, the per-key DB port |
| [deck-catalog.md](./deck-catalog.md) | `DECK_CATALOG` — the one configurable list behind both the deck grid and the side menu; absence-means-default config |
| [features.md](./features.md) | household (five aggregates, incl. SOYKAF) · tasks/tracking/barcode/office-time/trackplay/geist · the shared list kit · how types are sliced |
| [cash.md](./cash.md) | CREDSTICK: integer cents, categorization rules, reconciliation, transfers, per-bank CSV import, reporting |
| [theming.md](./theming.md) | the boot splash and the FOUC gate, user accent overrides, adding a third theme. The token model itself now lives in `src/global.scss` and `src/theme/` |
| [i18n.md](./i18n.md) | ngx-translate v18, the language switch, **the composed-key problem** and the `i18n:extract` flags, the `@shared` vocabulary gate |
| [testing.md](./testing.md) | the three test layers, **the five Ionic locator traps**, the a11y rule set, gate discipline |
| [build-and-deploy.md](./build-and-deploy.md) | commands, Capacitor/Android + postsync, release identity, the update prompt, Codeberg CI/CD + Pages |
| [open-tasks.md](./open-tasks.md) | the live backlog — blocked, waiting on upstream, deferred, and what was considered and not built |
| [decisions.md](./decisions.md) | **settled questions, kept so they are not re-flagged as work** — each declined simplification with the measurement that killed it |
| [patterns.md](./patterns.md) | the transferable pattern behind each seam, as a jump table |

Siblings outside the compendium: [coding-conventions.md](./coding-conventions.md) (how code is
written here, split into enforced and not) and [ionic-a11y-practices.md](./ionic-a11y-practices.md)
(R1–R9, seven of which are gated by `eslint-plugin-commlink/`). Rationale constraining **more than
one file** is said once, in the compendium file that owns the seam — there is no separate specs
tree, and an index with nothing under it would be exactly the dead configuration these gates exist
to catch.

### Start here, by task

| If you are about to… | Read |
| --- | --- |
| let one feature use another | [cross-feature-communication.md](./cross-feature-communication.md) — first, always |
| add a slice, a context, a persisted key or a migration | [lifecycle-and-persistence.md](./lifecycle-and-persistence.md) |
| add a page, a route or a domain folder | [architecture.md](./architecture.md) |
| add or change a dialog / a form | [dialogs-and-forms.md](./dialogs-and-forms.md) |
| add a translation key family | [i18n.md](./i18n.md) — composing a key at the call site is what makes `--clean` delete it |
| add a theme, or style anything | `src/global.scss` — the style layer specifies itself; [theming.md](./theming.md) for the splash, accents and the third-theme halves |
| write a spec, especially e2e | [testing.md](./testing.md) — the five locator traps |
| propose work, or clear "what's left" | [open-tasks.md](./open-tasks.md), then [decisions.md](./decisions.md) — most of what looks undone is blocked or declined on purpose |
| touch the household subsystem | [features.md](./features.md), then [lifecycle-and-persistence.md](./lifecycle-and-persistence.md) |
| touch cash | [cash.md](./cash.md) |

---

## The app

`np-commlink` is one Ionic 8 / Angular 21 (standalone, zoneless) / Capacitor 8 app merging two former
apps — **np-timetracker** (time & office tracking) and **np-kitchen-bot** (groceries / storage /
tasks) — under one Shadowrun "cyberdeck" skin. It ships as a PWA and an Android APK. There is **no
backend**: all state is local (NgRx in memory, `@ionic/storage` on disk).

Structurally it is a **super-app**: a home "deck" (`/commlink`) of independent _programs_, each a
self-contained feature. The architecture's whole job is to keep those programs independent while
still letting the deck — and the handful of genuine cross-feature behaviours — work. That tension is
what every channel in [cross-feature-communication.md](./cross-feature-communication.md) resolves.

### The module map

| Context | Role | Lifecycle | Reaches others via |
| --- | --- | --- | --- |
| `@shared` | shared kernel: library + published contracts | eager (a library, not a domain) | — (it is the medium) |
| `commlink` | home deck + the dashboard read-model + the deck catalog | lazy page, **eager slices** | reads its own read-model, which suppliers `report` into |
| `tracking` | time tracking (single-list engine) | **lazy** | publishes notifications; reports telemetry; receives deep-link CTAs |
| `office-time` | office-presence dashboard, wordclock | **lazy** | reports telemetry |
| `notifications` | in-app + OS notification inbox | lazy page, **eager slice** | receives `NotificationsActions` from any producer; deep-links to `/tracking` |
| `household` | shopping + storage + products + SOYKAF recipes (one slice) | **lazy** | reports telemetry; provides a list facade |
| `tasks` | to-do list | **lazy**, fully sealed | reports telemetry; provides a list facade |
| `cash` | offline multi-account ledger (CREDSTICK) | **lazy** | reports telemetry |
| `trackplay` | Shadowrun game-score tracker | **lazy** | reports telemetry |
| `barcode` | SIGIL badge image (owns its own slice) | **lazy**, fully sealed | imports nothing, reports nothing |
| `settings` | app-global settings (schema version, theme, language) | lazy page, **eager slice** | sealed |
| `geist` | GEIST — console onto Chrome's on-device model | lazy page, **no slice at all** | nothing: no state, no telemetry, no contract |

The **shell** (`src/app/` root: `AppComponent`, `app.routes.ts`, `app.providers.ts`,
`app-title.strategy.ts`) carries only `type:shell` — no domain tag — so it may compose everything.
That licence is exactly why it composes as little as possible.
