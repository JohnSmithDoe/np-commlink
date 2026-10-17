/* ─── why ─────────────────────────────────────────────────────────
 * Games seating a removed person are swept on load, not on a delete event
 * from `people`: this slice hydrates per route and would miss the event,
 * and an eager purge would outlive an undo of the person. It waits for
 * BOTH reads — an unread roster is not an empty one.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Service } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { PersonRef } from '../../@shared/model/person.types';
import { PEOPLE } from '../../@shared/util/people/people.token';
import { hasOrphanGames } from '../util/trackplay.cascade';
import { TrackplayActions } from './trackplay.actions';
import { selectTrackplayPersisted } from './trackplay.selector';

@Service()
export class TrackplayOrphansEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #roster$ = toObservable(inject(PEOPLE));

  sweepOrphans$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackplayActions.loaded),
      switchMap(() =>
        this.#roster$.pipe(
          filter((people): people is readonly PersonRef[] => !!people),
          take(1)
        )
      ),
      map((people) => new Set(people.map(({ id }) => id))),
      concatLatestFrom(() => this.#store.select(selectTrackplayPersisted)),
      filter(([people, trackplay]) => hasOrphanGames(trackplay, people)),
      map(([people]) => TrackplayActions.sweepOrphans([...people]))
    );
  });
}
