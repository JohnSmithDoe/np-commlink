/* ─── why ─────────────────────────────────────────────────────────
 * The resolver only fires on arrival, and on a phone the common path is
 * RESUME, not reload: AGENDA left open, the app backgrounded overnight,
 * brought forward the next day with no navigation to trigger anything.
 *
 * `TodayService` is already the app's answer to that — one midnight timeout
 * plus a `visibilitychange` refresh, which is what makes resuming count. Its
 * signal holds an ISO day, so resuming on the SAME day re-sets an equal
 * string and emits nothing; only a real day change reaches here. `skip(1)`
 * drops the current value, which the resolver has just dealt with.
 * ───────────────────────────────────────────────────────────────── */
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { filter, map, skip, withLatestFrom } from 'rxjs';
import { TodayService } from '../../@shared/data/services/today.service';
import { tasksDueToReopen } from '../util/task.utils';
import { TasksActions } from './tasks.actions';
import { selectTaskItems } from './tasks.selector';

export const tasksDayRolloverEffects = {
  reopenOnDayChange$: createEffect(
    (today = inject(TodayService), store = inject(Store)) => {
      return toObservable(today.today).pipe(
        skip(1),
        withLatestFrom(store.select(selectTaskItems)),
        map(([day, items]) => tasksDueToReopen(items, dayjs(day))),
        filter((due) => due.length > 0),
        map((due) => TasksActions.reopenDue(due))
      );
    },
    { functional: true }
  ),
};
