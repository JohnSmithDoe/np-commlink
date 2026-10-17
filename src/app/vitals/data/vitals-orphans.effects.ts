/* ─── why ─────────────────────────────────────────────────────────
 * A removed person's readings and pills are swept here, on load, rather
 * than on a delete event from `people`: this slice hydrates per route, so
 * a delete made while BIOMON was never opened would reach no reducer, and
 * an eager purge would leave an undo of the person restoring nobody's
 * data. Reconciling against the roster catches every delete, late.
 *
 * It waits for BOTH reads. An unread roster is not an empty one.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Service } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { PersonRef } from '../../@shared/model/person.types';
import { PEOPLE } from '../../@shared/util/people/people.token';
import { hasOrphans } from '../util/vitals.cascade';
import { VitalsActions } from './vitals.actions';
import { selectVitalsState } from './vitals.selector';

@Service()
export class VitalsOrphansEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #roster$ = toObservable(inject(PEOPLE));

  sweepOrphans$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(VitalsActions.loaded),
      switchMap(() =>
        this.#roster$.pipe(
          filter((people): people is readonly PersonRef[] => !!people),
          take(1)
        )
      ),
      map((people) => new Set(people.map(({ id }) => id))),
      concatLatestFrom(() => this.#store.select(selectVitalsState)),
      filter(([people, vitals]) => hasOrphans(vitals, people)),
      map(([people]) => VitalsActions.sweepOrphans([...people]))
    );
  });
}
