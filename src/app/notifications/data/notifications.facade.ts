import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/notification/notifications.actions';
import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNewNotifications,
} from './notifications.selector';

/**
 * The `notifications` domain facade — the single NgRx surface for the
 * notifications page. Reads the display selectors from the notifications slice
 * and dispatches the shared, domain-blind `NotificationsActions` (the same
 * durable contract tracking writes through off-route, §7). Injects `Store` so
 * the page never does.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  readonly #store = inject(Store);

  readonly newNotifications = this.#store.selectSignal(selectNewNotifications);
  readonly doneNotifications = this.#store.selectSignal(
    selectDoneNotifications
  );
  readonly doneCollapsed = this.#store.selectSignal(selectDoneCollapsed);

  markPageViewed(): void {
    this.#store.dispatch(NotificationsActions.markPageViewed());
  }

  markDone(id: string): void {
    this.#store.dispatch(NotificationsActions.markDone(id));
  }

  removeNotification(id: string): void {
    this.#store.dispatch(NotificationsActions.removeNotification(id));
  }

  toggleDoneSection(): void {
    this.#store.dispatch(NotificationsActions.toggleDoneSection());
  }

  clearDone(): void {
    this.#store.dispatch(NotificationsActions.clearDone());
  }

  addDebugNotification(): void {
    this.#store.dispatch(NotificationsActions.addDebugNotification());
  }
}
