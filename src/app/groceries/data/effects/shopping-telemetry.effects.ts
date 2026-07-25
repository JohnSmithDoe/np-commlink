import { inject, Injectable } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectShoppingState } from '../shopping.selector';

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

  report$ = createTelemetryEffect(
    this.#store,
    'shopping',
    selectActiveShoppingCount,
    metric('active')
  );
}
