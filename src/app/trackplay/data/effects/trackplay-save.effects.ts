import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import {
  bySourcePrefix,
  createSaveEffect,
} from '../../../@shared/data/create-save.effect';
import { selectTrackplayState } from '../trackplay.selector';

// Persist the trackplay slice on any [Trackplay] action (lazy-modules plan §4:
// each module owns its own save). Split out of the shell's saveGroceryOnChange$
// when trackplay went lazy; registered with the slice on the trackplay routes
// (see provide-trackplay-lazy.ts), so `state.trackplay` is always present.
//
// Behaviour preserved: it saves on every `[Trackplay]` action (including the
// `Enter … Page` orchestration hooks — a harmless re-write of already-hydrated
// data) EXCEPT the `[Trackplay] load`/`loaded` hydration lifecycle, which
// `bySourcePrefix` filters out (the resolver dispatches `[Trackplay] load` while
// the slice is still empty, so persisting on it would clobber the saved games).
@Injectable({ providedIn: 'root' })
export class TrackplaySaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createSaveEffect(
    this.#store,
    this.#database,
    this.#actions$.pipe(filter(bySourcePrefix('[Trackplay]'))),
    selectTrackplayState,
    'trackplay'
  );
}
