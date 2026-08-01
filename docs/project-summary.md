# np-commlink — project summary

The index of this repo's compendium: what the app is, and where the reasoning behind every seam
now lives. It used to be one 1800-line file; it was split so a reader — human or agent — loads the
one part a task needs instead of all of it. **Nothing was rewritten in the split, and the section
numbers did not change:** a `§7.3` in a source comment still means the same section, now in
[cash.md](./cash.md). The map below is the only thing that resolves `§N` → file.

`CLAUDE.md` is the working guide for day-to-day changes; these documents are the reasoning behind
it. Design history (the two-app merge, the DDD re-domaining, the lazy cutover, the sheriff
tightening) lives in the git commit log.

---

## Where to look

| §         | File                                                                     | What is in it                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | this file                                                                | what the app is + the module map (below)                                                                                                                            |
| 2.1–2.5   | [architecture.md](./architecture.md)                                     | the two forces (sealed contexts × laziness), folder layout, Sheriff dep rules, routing, NgRx behind per-domain facades                                               |
| 2.6       | [dialogs-and-forms.md](./dialogs-and-forms.md)                           | why dialog state left the store, the two dialog bases, Signal Forms, the shared form rules                                                                          |
| 3 + 6     | [cross-feature-communication.md](./cross-feature-communication.md)       | **the five channels** any cross-feature interaction must use, and the two inverted capabilities (dashboard read-model, notification sink) + the context map          |
| 4 + 5     | [lifecycle-and-persistence.md](./lifecycle-and-persistence.md)           | what boots vs what registers per route, the global error boundary, `providePersistedContext`, the list-flow effect builders, **lazy ≠ unloaded**, the per-key DB port |
| 7.1       | [deck-catalog.md](./deck-catalog.md)                                     | `DECK_CATALOG` — the one configurable list behind both the deck grid and the side menu; absence-means-default config                                                 |
| 7.2, 7.4–7.6 | [features.md](./features.md)                                          | groceries (five aggregates, incl. SOYKAF) · tasks/tracking/barcode/office-time/trackplay/geist · the shared list kit · how types are sliced                          |
| 7.3       | [cash.md](./cash.md)                                                     | CREDSTICK: integer cents, categorization rules, reconciliation, transfers, per-bank CSV import, reporting                                                             |
| 8         | [theming.md](./theming.md)                                               | cyberpunk vs OK Boomer, the flip-token model, the self-hosted deck font, adding a third theme                                                                                                  |
| 9         | [i18n.md](./i18n.md)                                                     | ngx-translate v18, the language switch, **the composed-key problem** and the `i18n:extract` flags, the `@shared` vocabulary gate                                      |
| 10        | [testing.md](./testing.md)                                               | the three test layers, **the five Ionic locator traps**, the a11y rule set, gate discipline                                                                          |
| 11        | [build-and-deploy.md](./build-and-deploy.md)                             | commands, Capacitor/Android + postsync, release identity, the update prompt, Codeberg CI/CD + Pages                                                                  |
| 12 + 13   | [open-tasks.md](./open-tasks.md)                                         | the live backlog (blocked / deferred / declined), the **recorded decisions kept so they are not re-flagged as work**, and what was considered and not built           |
| 14        | [patterns.md](./patterns.md)                                             | the transferable pattern behind each seam, as a jump table                                                                                                          |

Sibling documents outside the compendium: [coding-conventions.md](./coding-conventions.md) (how
code is written here) and [ionic-a11y-practices.md](./ionic-a11y-practices.md) (R1–R9, seven of
which are gated by `eslint-plugin-commlink/`).

### Start here, by task

| If you are about to…                                    | Read                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| let one feature use another                             | [cross-feature-communication.md](./cross-feature-communication.md) — §3 first, always             |
| add a slice, a context, a persisted key or a migration  | [lifecycle-and-persistence.md](./lifecycle-and-persistence.md)                                    |
| add a page, a route or a domain folder                  | [architecture.md](./architecture.md) §2.2–2.4                                                     |
| add or change a dialog / a form                         | [dialogs-and-forms.md](./dialogs-and-forms.md)                                                    |
| add a translation key family                            | [i18n.md](./i18n.md) — composing a key at the call site is what makes `--clean` delete it         |
| add a theme, or style anything                          | [theming.md](./theming.md) — retheme tokens, never components one by one                          |
| write a spec (especially e2e)                           | [testing.md](./testing.md) — the five locator traps                                               |
| propose work / clear "what's left"                      | [open-tasks.md](./open-tasks.md) — most of what looks undone is blocked or declined on purpose    |
| touch the grocery subsystem                             | [features.md](./features.md) §7.2, then [lifecycle-and-persistence.md](./lifecycle-and-persistence.md) |
| touch cash                                              | [cash.md](./cash.md)                                                                              |

---

## 1. The app

`np-commlink` is one Ionic 8 / Angular 21 (standalone, zoneless) / Capacitor 8 app that merges two
former apps — **np-timetracker** (time & office tracking) and **np-kitchen-bot** (groceries /
storage / tasks) — under one Shadowrun "cyberdeck" skin. It ships as a PWA and an Android APK.
There is **no backend**: all state is local (NgRx in memory, `@ionic/storage` on disk).

Structurally it is a **super-app**: a home "deck" (`/commlink`) of independent _programs_, each a
self-contained feature. The architecture's whole job is to keep those programs independent while
still letting the deck — and the handful of genuine cross-feature behaviours — work. That tension
is what every channel in §3 exists to resolve.

### The module map

| Context         | Role                                                     | Lifecycle                      | Reaches others via                                     |
| --------------- | -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| `@shared`       | shared kernel: library + published contracts             | eager (a library, not a domain) | — (it is the medium)                                   |
| `commlink`      | home deck + the dashboard read-model + the deck catalog  | lazy page, **eager slices**    | reads its own read-model, which suppliers `report` into |
| `tracking`      | time tracking (single-list engine)                       | **lazy**                       | publishes notifications; reports telemetry; receives deep-link CTAs |
| `office-time`   | office-presence dashboard, wordclock                     | **lazy**                       | reports telemetry                                      |
| `notifications` | in-app + OS notification inbox                           | lazy page, **eager slice**     | receives `NotificationsActions` from any producer; deep-links to `/tracking` |
| `groceries`     | shopping + storage + products + SOYKAF recipes (one slice) | **lazy**                     | reports telemetry; provides a list facade              |
| `tasks`         | to-do list                                               | **lazy**, fully sealed         | reports telemetry; provides a list facade              |
| `cash`          | offline multi-account ledger (CREDSTICK)                 | **lazy**                       | reports telemetry                                      |
| `trackplay`     | Shadowrun game-score tracker                             | **lazy**                       | reports telemetry                                      |
| `barcode`       | SIGIL badge image (owns its own slice)                   | **lazy**, fully sealed         | imports nothing, reports nothing                       |
| `settings`      | app-global settings (schema version, theme, language)    | lazy page, **eager slice**     | sealed                                                 |
| `geist`         | GEIST — console onto Chrome's on-device model            | lazy page, **no slice at all** | nothing: no state, no telemetry, no contract           |

The **shell** (`src/app/` root: `AppComponent`, `app.routes.ts`, `app.providers.ts`,
`app-title.strategy.ts`) carries only `type:shell` — no domain tag — so it may compose everything.
That licence is exactly why it composes as little as possible.
