import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  EMPTY,
  filter,
  from,
  fromEvent,
  map,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { OfficeTimeActions } from '../office-time/office-time.actions';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import {
  selectHolidays,
  selectOfficeTimeState,
} from '../office-time/office-time.selector';
import { Dayjs } from 'dayjs';
import {
  dayjsFromString,
  serializeDateMap,
  serializeDates,
} from '../office-time/office-time.utils';
import { IOfficeTimeStateStorage } from '../../model';

@Injectable({ providedIn: 'root' })
export class OfficeTimeEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #http = inject(HttpClient);
  #database = inject(DatabaseService);

  initOfficeTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.initOfficeTime),
      map(() => OfficeTimeActions.loadHolidays())
    );
  });

  loadHolidays$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.loadHolidays),
      switchMap(() =>
        this.#loadHolidays().pipe(
          map(OfficeTimeActions.loadHolidaysSuccess),
          catchError(() => of(OfficeTimeActions.loadHolidaysFailure()))
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
      map(() => OfficeTimeActions.loadHolidays())
    );
  });

  saveOn$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        OfficeTimeActions.addFreeday,
        OfficeTimeActions.addOfficeTime,
        OfficeTimeActions.addOfficeday,
        OfficeTimeActions.resetData,
        OfficeTimeActions.saveDashboardSettings,
        OfficeTimeActions.saveTargetOfficeDaysPerWeek,
        OfficeTimeActions.setFreedays,
        OfficeTimeActions.setOfficedays
      ),
      map(() => OfficeTimeActions.saveOfficeTime())
    );
  });

  saveOfficeTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.saveOfficeTime),
      withLatestFrom(this.#store.select(selectOfficeTimeState)),
      switchMap(([_, state]) => {
        const toSave: IOfficeTimeStateStorage = {
          ...state,
          holidays: serializeDateMap(state.holidays),
          officedays: serializeDates(state.officedays),
          freedays: serializeDates(state.freedays),
        };
        return from(this.#database.save('officeTime', toSave)).pipe(
          map(() => OfficeTimeActions.saveOfficeTimeSuccess()),
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
