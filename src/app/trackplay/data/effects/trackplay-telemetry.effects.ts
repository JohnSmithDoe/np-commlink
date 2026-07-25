import { inject, Injectable } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectGames } from '../trackplay.selector';

// Total number of games (all types, ended or not) on the deck's TRACKPLAY tile.
export const selectGameCount = createSelector(
  selectGames,
  (games) => Object.keys(games ?? {}).length
);

// Telemetry inversion (§4, CQRS): trackplay *pushes* its game count to the
// shared dashboard read-model. Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class TrackplayTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'trackplay',
    selectGameCount,
    metric('games')
  );
}
