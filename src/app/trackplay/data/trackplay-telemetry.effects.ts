import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import { selectGames } from './trackplay.selector';

// Total number of games (all types, ended or not) on the deck's TRACKPLAY tile.
export const selectGameCount = createSelector(
  selectGames,
  (games) => Object.keys(games ?? {}).length
);

// Telemetry inversion (§4, CQRS): trackplay *pushes* its game count to the
// shared dashboard read-model. store.select emits on registration and on every
// change. Imports only its own selector + the @shared contract; commlink never
// imports here.
@Injectable({ providedIn: 'root' })
export class TrackplayTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store
      .select(selectGameCount)
      .pipe(
        map((games) =>
          DashboardActions.report({ source: 'trackplay', metrics: { games } })
        )
      );
  });
}
