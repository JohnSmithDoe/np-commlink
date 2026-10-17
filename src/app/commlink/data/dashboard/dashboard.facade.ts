import { inject, Signal, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectDashboardState,
  selectNotificationsUnread,
} from './dashboard.selector';

@Service()
export class DashboardFacade {
  readonly #store = inject(Store);

  readonly notificationsUnread: Signal<number> = this.#store.selectSignal(
    selectNotificationsUnread
  );

  readonly dashboardState = this.#store.selectSignal(selectDashboardState);
}
