import { ShareService } from '../../@shared/data/services/share.service';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  EMPTY,
  from,
  map,
  switchMap,
  takeWhile,
  timer,
  withLatestFrom,
} from 'rxjs';
import { TrackingActions } from './tracking.actions';
import {
  selectArchivedSessions,
  selectRunningTrackingItem,
  selectTrackingDataViewId,
} from './tracking.selector';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { DataItem, TrackingViewId } from '../model/tracking.types';
import {
  csvRow,
  formatSecondsAsClock,
  formatViewDate,
} from '../util/tracking.utils';
import { groupSessionsByView } from '../util/sessions.utils';
import { TodayService } from '../../@shared/data/services/today.service';

@Injectable({ providedIn: 'root' })
export class TrackingEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #translate = inject(TranslateService);
  readonly #share = inject(ShareService);
  readonly #today = inject(TodayService);

  trackTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.toggleTrackingItem, TrackingActions.loaded),
      switchMap(() => {
        return timer(0, 1000).pipe(
          withLatestFrom(this.#store.select(selectRunningTrackingItem)),
          map(([, item]) => item),
          takeWhile((item): item is NonNullable<typeof item> => !!item),
          map((item) => TrackingActions.updateTracking(item, dayjs().format()))
        );
      })
    );
  });

  shareData$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.shareData),
        withLatestFrom(
          this.#store.select(selectArchivedSessions),
          this.#store.select(selectTrackingDataViewId)
        ),
        switchMap(([, sessions, viewId]) => {
          const data = groupSessionsByView(
            sessions,
            viewId,
            this.#today.today()
          );
          const csv = this.#buildCsv(data, viewId);
          return from(
            this.#share.share({
              title: this.#translate.instant(marker('share.csv.title')),
              text: csv,
              dialogTitle: this.#translate.instant(marker('share.csv.dialog')),
            })
          ).pipe(catchError(() => EMPTY));
        })
      );
    },
    { dispatch: false }
  );

  #buildCsv(data: DataItem[], viewId: TrackingViewId): string {
    const header = csvRow([
      this.#translate.instant(marker('csv.header.name')),
      this.#translate.instant(marker('csv.header.start-time')),
      this.#translate.instant(marker('csv.header.tracked-seconds')),
      this.#translate.instant(marker('csv.header.tracked-clock')),
    ]);
    const rows = data.map((item) =>
      csvRow([
        item.name,
        formatViewDate(item.startTime, viewId),
        item.trackedTimeInSeconds,
        formatSecondsAsClock(item.trackedTimeInSeconds ?? 0),
      ])
    );
    return [header, ...rows].join('\r\n');
  }
}
