import { inject, Service } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, fromEvent, map, withLatestFrom } from 'rxjs';
import { OfficeTimeActions } from './office-time.actions';
import { Store } from '@ngrx/store';
import { selectHolidays } from './office-time.selector';
import { berlinHolidaysFor } from '../util/holidays.utils';
import { areHolidaysStale } from '../util/office-time.utils';

const currentYear = (): number => {
  const now = new Date();
  return now.getFullYear();
};

@Service()
export class OfficeTimeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);

  loadHolidays$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.loadHolidays),
      map(() => {
        return OfficeTimeActions.loadHolidaysSuccess(
          berlinHolidaysFor(currentYear())
        );
      })
    );
  });

  refreshOnYearRollover$ = createEffect(() => {
    return fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
      withLatestFrom(this.#store.select(selectHolidays)),
      filter(([, holidays]) => areHolidaysStale(holidays, currentYear())),
      map(() => OfficeTimeActions.loadHolidays())
    );
  });
}
