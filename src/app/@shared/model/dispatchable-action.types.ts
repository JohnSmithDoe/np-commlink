/* ─── why ─────────────────────────────────────────────────────────
 * Typed `{ type: string }` rather than NgRx's `Action` because
 * `ngrx-data-layer-only` allows `@ngrx/*` in `data/` alone, and this is
 * `model/`. They are the same shape, so `Store.dispatch` accepts it; the
 * structural form gives up only the creator's literal type.
 *
 * Carrying an action inside another action's payload — a toast that offers
 * one, an undo entry that remembers one — is legal only while
 * `app.providers.ts` sets no `strictActionSerializability`.
 * ───────────────────────────────────────────────────────────────── */

export type DispatchableAction = { type: string };
