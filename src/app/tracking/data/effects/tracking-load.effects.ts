import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { ITrackingState } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { TrackingActions } from '../tracking.actions';

// Own-data load for the tracking context (lazy-modules plan §4). Reads only the
// `tracking` key and emits `loaded`; the reducer + trackTime$ hydrate on it. On
// a storage failure it still emits `loaded(null)`.
@Injectable({ providedIn: 'root' })
export class TrackingLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<ITrackingState>(
    this.#actions$,
    this.#database,
    TrackingActions.load,
    TrackingActions.loaded,
    'tracking'
  );
}
