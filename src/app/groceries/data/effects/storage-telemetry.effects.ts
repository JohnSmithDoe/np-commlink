import { inject, Injectable } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectStorageState } from '../storage.selector';

// Count of low-stock items (below their minimum) for the deck's STASH tile.
// Mirrors the storage page's danger threshold: strictly below minAmount (equal
// is a warning, not counted).
export const selectLowStockCount = createSelector(
  selectStorageState,
  (state) =>
    state?.items.filter(
      (item) => item.minAmount != undefined && item.quantity < item.minAmount
    ).length ?? 0
);

// Telemetry inversion (§4, CQRS): storage *pushes* its low-stock count to the
// shared dashboard read-model. LAZY — registered with the grocery slice on
// route entry (provide-groceries-lazy). Imports only its own selector + the
// @shared contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class StorageTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'storage',
    selectLowStockCount,
    metric('low')
  );
}
