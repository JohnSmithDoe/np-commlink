import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { IAppState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';
import { TrackingActions } from './tracking.actions';

// Own-data save for the tracking context. Relocated from the eager shell
// `AppEffects` into the lazy tracking providers (lazy-modules §4): it persists
// only `state.tracking`, so it rides with the slice. Matches specific mutation
// actions (never `load`/`loaded`), so the boot/route load can't clobber saved
// data (the recurring lazy-cutover invariant).
@Injectable({ providedIn: 'root' })
export class TrackingSaveEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        // updateTracking is intentionally excluded: it fires every second
        // while an item runs, and the live counter is recomputed from
        // startTime + breakInSeconds on next load. Persisting on toggle /
        // reset / save-and-reset is enough.
        ofType(
          TrackingActions.addItem,
          TrackingActions.removeItem,
          TrackingActions.updateItem,
          TrackingActions.toggleTrackingItem,
          TrackingActions.resetTracking,
          TrackingActions.saveAndResetTracking,
          TrackingActions.resetAllTracking,
          TrackingActions.removeDataItem
        ),
        withLatestFrom(this.#store, (action, state: IAppState) => ({
          action,
          state,
        })),
        tap(({ state }) => {
          void this.#database.save('tracking', state.tracking);
        })
      );
    },
    { dispatch: false }
  );
}
