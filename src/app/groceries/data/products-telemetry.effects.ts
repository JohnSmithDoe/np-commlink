import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import { selectProductsState } from './products.selector';

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

  report$ = createEffect(() => {
    return this.#store
      .select(selectProductCount)
      .pipe(
        map((count) =>
          DashboardActions.report({ source: 'products', metrics: { count } })
        )
      );
  });
}
