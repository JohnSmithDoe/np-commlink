import { inject, Injectable, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectDashboardState,
  selectNotificationsUnread,
} from './selectors/dashboard.selector';

/**
 * Read facade over the `dashboard` read-model (the CQRS query side). Its two
 * consumers — the app shell's notification badge and the commlink deck — read it
 * through here instead of injecting `Store`, so the NgRx surface stays sealed
 * inside the data layer.
 *
 * The badge deliberately reads its count from this read-model rather than from
 * the notifications slice: the shell would otherwise name another domain's store
 * key, and the persisted summary is what gives a cold launch its number.
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  readonly #store = inject(Store);

  readonly notificationsUnread: Signal<number> = this.#store.selectSignal(
    selectNotificationsUnread
  );

  // The whole read-model. One read path for the deck: it maps `source` → status,
  // badge and status-strip readouts over an arbitrary set of tiles, so a
  // per-source signal factory would just be this map, re-derived per caller.
  readonly dashboardState = this.#store.selectSignal(selectDashboardState);
}
