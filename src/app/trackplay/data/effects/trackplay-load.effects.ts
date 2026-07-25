import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { ITrackplayState } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { TrackplayActions } from '../trackplay.actions';

// Own-data load for the trackplay context (lazy-modules plan §4). Reads the
// `trackplay` key and emits `loaded`; the reducer hydrates on it (seeding the
// default game types when the loaded slice has none).
@Injectable({ providedIn: 'root' })
export class TrackplayLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<ITrackplayState>(
    this.#actions$,
    this.#database,
    TrackplayActions.load,
    TrackplayActions.loaded,
    'trackplay'
  );
}
