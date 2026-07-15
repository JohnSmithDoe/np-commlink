import { inject, Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { IAppState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';

// Persist the trackplay slice on any [Trackplay] action (lazy-modules plan §4:
// each module owns its own save). Split out of the shell's saveGroceryOnChange$
// when trackplay went lazy; registered with the slice on the trackplay routes
// (see provide-trackplay-lazy.ts), so `state.trackplay` is always present.
//
// Behaviour preserved from saveGroceryOnChange$'s [Trackplay] branch: it saves
// on every `[Trackplay]` action (including the `Enter … Page` orchestration
// hooks — a harmless re-write of already-hydrated data) EXCEPT the
// `[Trackplay] load`/`loaded` hydration lifecycle. The resolver dispatches
// `[Trackplay] load` on route entry while the slice is still at empty
// initialState (before TrackplayLoadEffects reads storage back), so persisting
// on it would clobber the saved games. Hydration is not a mutation.
@Injectable({ providedIn: 'root' })
export class TrackplaySaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter(
          (action: { type: string }) =>
            /^\[Trackplay\]/.test(action.type) &&
            !/\] (load|loaded)$/.test(action.type)
        ),
        withLatestFrom(this.#store, (_action, state: IAppState) => state),
        tap((state) => {
          void this.#database.save('trackplay', state.trackplay);
        })
      );
    },
    { dispatch: false }
  );
}
