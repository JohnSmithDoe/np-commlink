import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './actions/notifications.actions';
import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNewNotifications,
} from './selectors/notifications.selector';

/**
 * The `notifications` domain facade — the single NgRx surface for the inbox
 * page. It dispatches the published write contract for the two ops it shares
 * with producers (`dismiss`/`remove`) and its own group for the view state, so
 * the page sees neither. Injects `Store` so the page never does.
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
    this.#store.dispatch(NotificationsInboxActions.markPageViewed());
  }

  dismiss(id: string): void {
    this.#store.dispatch(NotificationsActions.dismiss(id));
  }

  remove(id: string): void {
    this.#store.dispatch(NotificationsActions.remove(id));
  }

  toggleDoneSection(): void {
    this.#store.dispatch(NotificationsInboxActions.toggleDoneSection());
  }

  clearDone(): void {
    this.#store.dispatch(NotificationsInboxActions.clearDone());
  }

  addDebugNotification(): void {
    this.#store.dispatch(NotificationsInboxActions.addDebugNotification());
  }
}
