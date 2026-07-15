import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import { selectTrackingState } from './tracking.selector';

// Number of tracked activities on the deck's CHRONO tile.
export const selectTrackingItemCount = createSelector(
  selectTrackingState,
  (state) => state?.items.length ?? 0
);

// Telemetry inversion (§4, CQRS): tracking *pushes* its item count to the
// shared dashboard read-model. store.select emits the initial value on
// registration and on every change — lazy-safe. Imports only its own selector
// + the @shared contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class TrackingTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store
      .select(selectTrackingItemCount)
      .pipe(
        map((count) =>
          DashboardActions.report({ source: 'tracking', metrics: { count } })
        )
      );
  });
}
