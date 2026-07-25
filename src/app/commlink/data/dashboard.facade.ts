import { inject, Injectable, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectDashboardState,
  selectNotificationsUnread,
  selectTelemetry,
} from './dashboard.selector';

/**
 * Read facade over the eager `dashboard` read-model (the CQRS query side).
 * Consumers (the app shell's notification badge, the commlink deck) read the
 * read-model through this service instead of injecting `Store` directly, so the
 * NgRx surface stays sealed inside the data layer. The shell reads the unread
 * count from here rather than the lazy `notifications` slice, so it never
 * depends on a lazy domain (§7).
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  readonly #store = inject(Store);

  readonly notificationsUnread: Signal<number> = this.#store.selectSignal(
    selectNotificationsUnread
  );

  // The whole read-model, for the commlink deck's per-tile badges.
  readonly dashboardState = this.#store.selectSignal(selectDashboardState);

  // Per-source telemetry entry (called once from a component field initializer).
  telemetry(source: string) {
    return this.#store.selectSignal(selectTelemetry(source));
  }
}
