# Patterns named

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §14 — the transferable pattern behind each seam, and where it shows up in this repo.
> Use it as a jump table: find the pattern, follow it to the section that explains the decision.

## 14. Patterns named

| Pattern                                         | Where it shows up here                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Bounded context / shared kernel                 | Sheriff domains; `@shared` as a library                                       |
| Dependency Inversion (cross-cutting capability) | dashboard + notifications invert onto `@shared` contracts                     |
| CQRS read-model                                 | eager `dashboard` slice in `commlink/data`, fed by `report`, read by the deck  |
| Shared port ≠ shared read-model                 | only `DashboardActions.report` is in `@shared`; the slice belongs to its reader |
| Published Language / Open Host Service          | `DashboardActions.report`, `NotificationsActions`                             |
| Ports & Adapters                                | `DatabaseService` (per-key), `NotificationService` (OS adapter)                |
| Deferred command                                | notification CTA → `/tracking?cmd=` deep-link                                 |
| Facade + DI token                               | `LIST_FACADE` / `CATEGORY_LIST_FACADE` decoupling generic pages from domains      |
| Architectural fitness function                  | eslint bans on `@ngrx` outside `data/` and on domain vocabulary in `@shared`   |
| Idempotent initialization                       | `DatabaseService.#ensureStorage()` memoized `create()`                         |
| Capability sink stays central                   | dashboard read-model + notification inbox eager despite everything else lazy   |
| Route a context by its writers, not its page     | the inbox is eager; `/notifications` is still a lazy page                     |
| Domain-owned route manifest                     | `<domain>/routes/<domain>.routes.ts`; the shell is a `path → loadChildren` table |
| Share the behaviour, not the instance           | `item-list.effects.factory` builders vs one shared effect class                |
| Pick the primitive by lifetime                  | dialog open-command as a signal, not a store slice                            |
| Ship the upgrade mechanism before the upgrade   | the `SwUpdate` prompt has to be in v1 to be able to announce v2               |
| One writer, many readers (no drift gate needed) | `package.json` version → esbuild `define` → web app + both Gradle fields      |
| Invariant over remembered rule                  | one `groceries` slice retired the co-registration rule                        |
| Fix the model before widening the abstraction   | groceries' bespoke load/save was four slices that were one context            |
| No global schema                                | `IAppState` deleted; ownership follows the slice                              |
| Strangler Fig / Expand-Contract                 | the migration approach throughout (see git history)                           |
