import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  EMPTY,
  filter,
  from,
  fromEvent,
  map,
  mergeMap,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { DatabaseService } from '../../../@shared/util/database.service';
import { officeTimeActions } from './office-time.actions';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { selectHolidays, selectOfficeTimeState } from './office-time.selectors';
import { Dayjs } from 'dayjs';
import {
  dayjsFromString,
  rotateBase64,
  serializeDateMap,
  serializeDates,
} from './office-time.utils';
import { IOfficeTimeStateStorage } from '../../../@shared/types';

@Injectable({ providedIn: 'root' })
export class OfficeTimeEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #http = inject(HttpClient);
  #database = inject(DatabaseService);

  initOfficeTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(officeTimeActions.initOfficeTime),
      map(() => officeTimeActions.loadHolidays())
    );
  });

  rotateBarcode$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(officeTimeActions.rotateBarcode),
      withLatestFrom(this.#store.select(selectOfficeTimeState)),
      switchMap(([_, state]) => {
        return from(rotateBase64(state.barcode, 90)).pipe(
          // When rotation actually produced a new image, commit it.
          // Otherwise (no barcode set, image load error, draw failure)
          // emit nothing so we don't churn the saveOn$ effect with an
          // identical write.
          mergeMap((rotated) =>
            rotated && rotated !== state.barcode
              ? of(officeTimeActions.rotateBarcodeSuccess(rotated))
              : EMPTY
          ),
          catchError(() => EMPTY)
        );
      })
    );
  });

  loadHolidays$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(officeTimeActions.loadHolidays),
      switchMap(() =>
        this.#loadHolidays().pipe(
          map(officeTimeActions.loadHolidaysSuccess),
          catchError(() => of(officeTimeActions.loadHolidaysFailure()))
        )
      )
    );
  });

  // When the tab becomes visible again, re-fetch holidays if the calendar
  // year has changed since the cached holidays were loaded — covers the
  // "left open across midnight Dec 31" case. Page navigation already
  // re-dispatches via initOfficeTime, so this is purely the long-session
  // fallback. The loaded year is read off the cached holidays themselves
  // instead of being mirrored into a separate field.
  refreshOnYearRollover$ = createEffect(() => {
    return fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
      withLatestFrom(this.#store.select(selectHolidays)),
      filter(([, holidays]) => {
        const sample = Object.values(holidays ?? {})[0];
        return !!sample && sample.year() !== new Date().getFullYear();
      }),
      map(() => officeTimeActions.loadHolidays())
    );
  });

  saveOn$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        officeTimeActions.addFreeday,
        officeTimeActions.addOfficeTime,
        officeTimeActions.addOfficeday,
        officeTimeActions.deleteBarcode,
        officeTimeActions.resetData,
        officeTimeActions.rotateBarcodeSuccess,
        officeTimeActions.saveBarcode,
        officeTimeActions.saveDashboardSettings,
        officeTimeActions.saveTargetOfficeDaysPerWeek,
        officeTimeActions.setFreedays,
        officeTimeActions.setOfficedays
      ),
      map(() => officeTimeActions.saveOfficeTime())
    );
  });

  saveOfficeTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(officeTimeActions.saveOfficeTime),
      withLatestFrom(this.#store.select(selectOfficeTimeState)),
      switchMap(([_, state]) => {
        const toSave: IOfficeTimeStateStorage = {
          ...state,
          holidays: serializeDateMap(state.holidays),
          officedays: serializeDates(state.officedays),
          freedays: serializeDates(state.freedays),
        };
        return from(this.#database.save('officeTime', toSave)).pipe(
          map(() => officeTimeActions.saveOfficeTimeSuccess()),
          // localforage can reject (storage quota, IndexedDB blocked).
          // Swallow so the effect stays alive for the next save attempt.
          catchError(() => EMPTY)
        );
      })
    );
  });

  #loadHolidays = () => {
    const currentYear = new Date().getFullYear();
    return this.#http
      .get<Record<string, { datum: string }>>(
        `assets/holidays/${currentYear}-BE.json`
      )
      .pipe(map((holidays) => this.#parseHolidays(holidays)));
  };

  #parseHolidays = (holidays?: Record<string, { datum: string }>) => {
    const _holidays: Record<string, Dayjs> = {};
    for (const key in holidays) {
      const parsed = dayjsFromString(holidays[key].datum);
      if (parsed) _holidays[key] = parsed;
    }
    return _holidays;
  };
}
