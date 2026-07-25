import { inject, Injectable } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectTrackingState } from '../tracking.selector';

// Number of tracked activities on the deck's CHRONO tile.
export const selectTrackingItemCount = createSelector(
  selectTrackingState,
  (state) => state?.items.length ?? 0
);

// Telemetry inversion (§4, CQRS): tracking *pushes* its item count to the
// shared dashboard read-model. Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class TrackingTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'tracking',
    selectTrackingItemCount,
    metric('count')
  );
}
