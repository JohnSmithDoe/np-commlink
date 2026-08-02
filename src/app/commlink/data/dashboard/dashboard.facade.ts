import { inject, Injectable, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectDashboardState,
  selectNotificationsUnread,
} from './dashboard.selector';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  readonly #store = inject(Store);

  readonly notificationsUnread: Signal<number> = this.#store.selectSignal(
    selectNotificationsUnread
  );

  readonly dashboardState = this.#store.selectSignal(selectDashboardState);
}
