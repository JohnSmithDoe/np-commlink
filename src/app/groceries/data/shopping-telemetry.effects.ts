import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import { selectShoppingState } from './shopping.selector';

// Count of active (not-yet-bought) shopping items for the deck's MARKET tile.
export const selectActiveShoppingCount = createSelector(
  selectShoppingState,
  (state) => state?.items.filter((item) => item.state === 'active').length ?? 0
);

// Telemetry inversion (§4, CQRS): shopping *pushes* its active-item count to the
// shared dashboard read-model. LAZY — registered with the grocery slice on
// route entry (provide-groceries-lazy), so the first `report` fires on entry
// and flips the tile standby→online; the cold-launch value comes from the
// persisted summary. Imports only its own selector + the @shared contract.
@Injectable({ providedIn: 'root' })
export class ShoppingTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store
      .select(selectActiveShoppingCount)
      .pipe(
        map((active) =>
          DashboardActions.report({ source: 'shopping', metrics: { active } })
        )
      );
  });
}
