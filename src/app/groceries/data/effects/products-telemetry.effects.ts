import { inject, Injectable } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectProductsState } from '../products.selector';

// Count of catalog products for the deck's CATALOG tile.
export const selectProductCount = createSelector(
  selectProductsState,
  (state) => state?.items.length ?? 0
);

// Telemetry inversion (§4, CQRS): products *pushes* its item count to the shared
// dashboard read-model. LAZY — registered with the grocery slice on route entry
// (provide-groceries-lazy). Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class ProductsTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'products',
    selectProductCount,
    metric('count')
  );
}
