/* ─── why ─────────────────────────────────────────────────────────
 * The recents live in the `settings` slice, and the field that shows them is
 * `type:ui` — which may not reach `data/`. This is the same inversion as
 * `LIST_FACADE`: the kernel declares a read-only contract, the owning slice
 * provides its own selector against it. A token rather than a service because
 * a service would need a public `publish()`, and then any module could write
 * recents through a channel no gate can see the direction of.
 *
 * The empty default keeps the contract optional: a field rendered without the
 * settings context offers no recents rather than failing to construct.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken, signal, Signal } from '@angular/core';

export const RECENT_EMOJIS = new InjectionToken<Signal<readonly string[]>>(
  'RECENT_EMOJIS',
  { factory: () => signal<readonly string[]>([]).asReadonly() }
);
