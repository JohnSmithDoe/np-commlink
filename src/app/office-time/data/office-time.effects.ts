import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, fromEvent, map, withLatestFrom } from 'rxjs';
import { OfficeTimeActions } from './office-time.actions';
import { Store } from '@ngrx/store';
import { selectHolidays } from './office-time.selector';
import { berlinHolidaysFor } from '../util/holidays.utils';
import { holidaysAreStale } from '../util/office-time.utils';

@Injectable({ providedIn: 'root' })
export class OfficeTimeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);

  loadHolidays$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.loadHolidays),
      map(() =>
        OfficeTimeActions.loadHolidaysSuccess(
          berlinHolidaysFor(new Date().getFullYear())
        )
      )
    );
  });

  refreshOnYearRollover$ = createEffect(() => {
    return fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
      withLatestFrom(this.#store.select(selectHolidays)),
      filter(([, holidays]) =>
        holidaysAreStale(holidays, new Date().getFullYear())
      ),
      map(() => OfficeTimeActions.loadHolidays())
    );
  });
}
