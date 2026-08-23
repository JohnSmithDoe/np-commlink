import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectOpenNotifications,
} from './notifications.selector';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  readonly #store = inject(Store);

  readonly openNotifications = this.#store.selectSignal(
    selectOpenNotifications
  );
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
}
