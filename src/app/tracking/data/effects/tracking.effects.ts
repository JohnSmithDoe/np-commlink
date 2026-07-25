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
import { TrackingActions } from '../tracking.actions';
import {
  selectRunningTrackingItem,
  selectTrackingData,
  selectTrackingDataViewId,
} from '../tracking.selector';
import { Share } from '@capacitor/share';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { IDataItem } from '../../model';
import { csvRow, formatSecondsAsClock } from '../tracking.utils';

const startTimeFormatFor = (viewId: string): string | undefined => {
  switch (viewId) {
    case 'daily':
    case 'today': {
      return 'DD.MM.YYYY';
    }
    case 'monthly': {
      return 'MM.YYYY';
    }
    case 'all': {
      return undefined;
    }
    default: {
      return 'DD.MM.YYYY HH:mm';
    }
  }
};

const formatStartTime = (item: IDataItem, viewId: string): string => {
  const format = startTimeFormatFor(viewId);
  return format ? dayjs(item.startTime).format(format) : '';
};

@Injectable({ providedIn: 'root' })
export class TrackingEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #translate = inject(TranslateService);

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
          this.#store.select(selectTrackingData),
          this.#store.select(selectTrackingDataViewId)
        ),
        switchMap(([, data, viewId]) => {
          const csv = this.#buildCsv(data, viewId);
          return from(
            Share.share({
              title: this.#translate.instant(marker('share.csv.title')),
              text: csv,
              dialogTitle: this.#translate.instant(marker('share.csv.dialog')),
            })
          ).pipe(
            // Share.share rejects when the user dismisses the sheet —
            // swallow so the effect stays alive for future shares.
            catchError(() => EMPTY)
          );
        })
      );
    },
    { dispatch: false }
  );

  #buildCsv(data: IDataItem[], viewId: string): string {
    const header = csvRow([
      this.#translate.instant(marker('csv.header.name')),
      this.#translate.instant(marker('csv.header.start-time')),
      this.#translate.instant(marker('csv.header.tracked-seconds')),
      this.#translate.instant(marker('csv.header.tracked-clock')),
    ]);
    const rows = data.map((item) =>
      csvRow([
        item.name,
        formatStartTime(item, viewId),
        item.trackedTimeInSeconds,
        formatSecondsAsClock(item.trackedTimeInSeconds ?? 0),
      ])
    );
    return [header, ...rows].join('\r\n');
  }
}
