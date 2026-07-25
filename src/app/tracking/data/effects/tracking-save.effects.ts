import { inject, Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createSaveEffect } from '../../../@shared/data/create-save.effect';
import { TrackingActions } from '../tracking.actions';
import { selectTrackingState } from '../tracking.selector';

// Own-data save for the tracking context. Relocated from the eager shell
// `AppEffects` into the lazy tracking providers (lazy-modules §4): it persists
// only `state.tracking`, so it rides with the slice. Triggers on specific
// mutation actions (never `load`/`loaded`), so the boot/route load can't clobber
// saved data (the recurring lazy-cutover invariant).
//
// updateTracking is intentionally excluded: it fires every second while an item
// runs, and the live counter is recomputed from startTime + breakInSeconds on
// next load. Persisting on toggle / reset / save-and-reset is enough.
@Injectable({ providedIn: 'root' })
export class TrackingSaveEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);

  saveOnChange$ = createSaveEffect(
    this.#store,
    this.#database,
    this.#actions$.pipe(
      ofType(
        TrackingActions.addItem,
        TrackingActions.removeItem,
        TrackingActions.updateItem,
        TrackingActions.updateSort,
        TrackingActions.toggleTrackingItem,
        TrackingActions.resetTracking,
        TrackingActions.saveAndResetTracking,
        TrackingActions.resetAllTracking,
        TrackingActions.removeDataItem
      )
    ),
    selectTrackingState,
    'tracking'
  );
}
