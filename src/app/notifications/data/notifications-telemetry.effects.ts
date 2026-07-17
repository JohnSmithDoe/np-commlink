import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import { selectNotificationsBadgeCount } from './notifications.selector';

// Telemetry inversion (§4, CQRS): notifications *pushes* its unread count to
// the shared dashboard read-model. Selecting from the store fires the initial
// value on registration and on every change — so this is lazy-safe. Imports
// only its own selector + the @shared contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class NotificationsTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store.select(selectNotificationsBadgeCount).pipe(
      map((unread) =>
        DashboardActions.report({
          source: 'notifications',
          metrics: { unread },
        })
      )
    );
  });
}
