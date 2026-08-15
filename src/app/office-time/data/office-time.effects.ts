import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  EMPTY,
  filter,
  from,
  fromEvent,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { OfficeTimeActions } from './office-time.actions';
import { Store } from '@ngrx/store';
import { selectHolidays, selectOfficeTimeState } from './office-time.selector';
import { dayKeysOf, serializeDateMap } from '../util/office-time.utils';
import { berlinHolidaysFor } from '../util/holidays.utils';
import {
  OfficeTimeState,
  OfficeTimeStateStorage,
} from '../model/office-time.types';
import { wrapVersioned } from '../../@shared/util/persistence/versioned';
import { APP_VERSION } from '../../@shared/model/app.consts';

const serializedForStorage = (
  state: OfficeTimeState
): OfficeTimeStateStorage => ({
  ...state,
  holidays: serializeDateMap(state.holidays),
  officedays: dayKeysOf(state.officedays),
  freedays: dayKeysOf(state.freedays),
});

@Injectable({ providedIn: 'root' })
export class OfficeTimeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

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
      filter(([, holidays]) => {
        const sample = Object.values(holidays ?? {})[0];
        return !!sample && sample.year() !== new Date().getFullYear();
      }),
      map(() => OfficeTimeActions.loadHolidays())
    );
  });

  saveOn$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        OfficeTimeActions.addFreeday,
        OfficeTimeActions.addOfficeTime,
        OfficeTimeActions.resetData,
        OfficeTimeActions.saveDashboardSettings,
        OfficeTimeActions.saveTargetOfficeDaysPerWeek,
        OfficeTimeActions.setFreedays,
        OfficeTimeActions.setOfficedays
      ),
      map(() => OfficeTimeActions.saveOfficeTime())
    );
  });

  saveOfficeTime$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(OfficeTimeActions.saveOfficeTime),
        withLatestFrom(this.#store.select(selectOfficeTimeState)),
        switchMap(([_, state]) =>
          from(
            this.#database.save(
              'officeTime',
              wrapVersioned(APP_VERSION, serializedForStorage(state))
            )
          ).pipe(catchError(() => EMPTY))
        )
      );
    },
    { dispatch: false }
  );
}
