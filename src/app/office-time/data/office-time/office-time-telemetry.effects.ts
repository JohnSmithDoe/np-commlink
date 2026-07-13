import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../../@shared/data/dashboard/dashboard.actions';
import { selectDashboardStatsYear } from './office-time.stats.selector';

// Telemetry inversion (§4, CQRS): office-time *pushes* its year stats to the
// shared dashboard read-model. Selecting from the store fires the initial
// value on registration and on every change — lazy-safe. Imports only its own
// selector + the @shared contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class OfficeTimeTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store.select(selectDashboardStatsYear).pipe(
      map((stats) =>
        DashboardActions.report({
          source: 'office-time',
          metrics: {
            officedays: stats.officedays,
            percentage: stats.percentage,
          },
        })
      )
    );
  });
}
