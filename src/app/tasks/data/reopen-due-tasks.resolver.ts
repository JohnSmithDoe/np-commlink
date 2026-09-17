/* ─── why ─────────────────────────────────────────────────────────
 * A resolver rather than an effect, and no timer. It runs before the list
 * is activated, so a task whose window has opened is already in OPEN on the
 * first paint — an effect on `routerNavigatedAction` fires after
 * `NavigationEnd`, which paints the row in DONE and then moves it.
 *
 * It sits on the `list` CHILD route because the parent carries the
 * hydration resolver, and Angular resolves a parent's before a child's — so
 * the slice is loaded by the time this reads it, with nothing here saying so.
 *
 * This covers arriving; `tasksDayRolloverEffects` covers staying. Neither
 * records that an occurrence was handled, because `tasksDueToReopen` derives
 * the answer from dates the task already stores.
 * ───────────────────────────────────────────────────────────────── */
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { map, take, tap } from 'rxjs';
import { TodayService } from '../../@shared/data/services/today.service';
import { tasksDueToReopen } from '../util/task.utils';
import { TasksActions } from './tasks.actions';
import { selectTaskItems } from './tasks.selector';

export const reopenDueTasksResolver: ResolveFn<boolean> = () => {
  const store = inject(Store);
  const today = inject(TodayService).today;
  return store.select(selectTaskItems).pipe(
    take(1),
    map((items) => tasksDueToReopen(items, dayjs(today()))),
    tap((due) => {
      if (due.length > 0) store.dispatch(TasksActions.reopenDue(due));
    }),
    map(() => true)
  );
};
