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
import { DatabaseService } from '../../@shared/util/persistence/database.service';
import { OfficeTimeActions } from './office-time.actions';
import { Store } from '@ngrx/store';
import { selectHolidays, selectOfficeTimeState } from './office-time.selector';
import { serializeDateMap, serializeDates } from '../util/office-time.utils';
import { berlinHolidaysFor } from '../util/holidays.utils';
import {
  IOfficeTimeState,
  IOfficeTimeStateStorage,
} from '../model/office-time.types';
import { wrapVersioned } from '../../@shared/util/persistence/versioned';
import { APP_VERSION } from '../../@shared/model/app.consts';

// Storage keeps calendar days as ISO strings; the state keeps Dayjs.
const serializedForStorage = (
  state: IOfficeTimeState
): IOfficeTimeStateStorage => ({
  ...state,
  holidays: serializeDateMap(state.holidays),
  officedays: serializeDates(state.officedays),
  freedays: serializeDates(state.freedays),
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

  // When the tab becomes visible again, re-fetch holidays if the calendar
  // year has changed since the cached holidays were loaded — covers the
  // "left open across midnight Dec 31" case. Page entry already re-dispatches
  // `loadHolidays`, so this is purely the long-session fallback. The loaded year
  // is read off the cached holidays themselves instead of being mirrored into a
  // separate field.
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

  // Non-dispatching like the shared save factory: nothing reacted to a save
  // having succeeded, so the write is the whole effect.
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
          ).pipe(
            // localforage can reject (storage quota, IndexedDB blocked).
            // Swallow so the effect stays alive for the next save attempt.
            catchError(() => EMPTY)
          )
        )
      );
    },
    { dispatch: false }
  );
}
