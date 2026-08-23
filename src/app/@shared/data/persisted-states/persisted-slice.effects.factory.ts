/* ─── why ─────────────────────────────────────────────────────────
 * The save half reports its failures because nothing else can: no backend,
 * no retry, so a full quota or an evicted origin leaves the user working
 * against the in-memory store, believing it saved, until the next launch.
 *
 * It reports ONCE PER KEY, not per failed write — whatever breaks a write
 * breaks every write after it, and the trigger is a mutation, so an
 * unlatched toast would fire on each keystroke of a search box.
 *
 * `concatMap` rather than `tap`: a rejected promise inside `tap` is
 * unobservable, and two saves of one key racing could land out of order.
 *
 * `sources` claims a whole domain as mutations, so the shared list events
 * that change only the VIEW are subtracted from it: a search term would
 * otherwise serialise the entire slice per debounce, and a filter is
 * re-dispatched from the route on every entry regardless of what was
 * stored. `updateSort` is NOT among them — two slices list it under `on:`
 * deliberately, and a sort survives a reload. Subtracting rather than
 * enumerating is deliberate too: a mutation forgotten out of an `on:` list
 * stops persisting silently, where an event missing from this set costs a
 * redundant write. `on:` remains the escape hatch, and the forms compose.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  ignoreElements,
  map,
  of,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import { APP_VERSION } from '../../model/app.consts';
import { DashboardTelemetry } from '../../model/dashboard.types';
import { DatabaseService } from '../persistence/database.service';
import { ReadBeforeWriteService } from '../persistence/read-before-write.service';
import {
  MigrationStep,
  runMigrations,
  wrapVersioned,
} from '../../util/persistence/versioned';
import { DashboardActions } from '../actions/dashboard.actions';
import { NotificationsActions } from '../actions/notifications.actions';

export type SliceLifecycle<T> = {
  load: ActionCreator<string, () => Action>;
  loaded: ActionCreator<string, (value: T | null) => Action>;
};

export type SaveTrigger = {
  sources?: string[];
  on?: { type: string }[];
};

export type TelemetrySpec<S> = {
  source: string;
  select: MemoizedSelector<object, S>;
  metrics: (value: S) => DashboardTelemetry['metrics'];
};

const HYDRATION_EVENT = /\] (load|loaded)$/;
const VIEW_ONLY_EVENT = /\] (updateSearch|updateFilter)$/;

const persistsNothing = (type: string): boolean =>
  HYDRATION_EVENT.test(type) || VIEW_ONLY_EVENT.test(type);

export const createLoadSliceEffect = <T>(
  lifecycle: SliceLifecycle<T>,
  key: string,
  ladder: MigrationStep[] = []
) =>
  createEffect(
    (
      actions$ = inject(Actions),
      database = inject(DatabaseService),
      reads = inject(ReadBeforeWriteService)
    ) => {
      return actions$.pipe(
        ofType(lifecycle.load),
        switchMap(() =>
          from(database.load<unknown>(key)).pipe(
            map((raw) => {
              const stored = runMigrations<T>(raw, APP_VERSION, ladder);
              reads.recordRead(key);
              return lifecycle.loaded(stored);
            }),
            catchError(() =>
              of(
                lifecycle.loaded(null),
                NotificationsActions.toast({
                  key: marker('toast.storage.unavailable'),
                  color: 'danger',
                })
              )
            )
          )
        )
      );
    },
    { functional: true }
  );

export const createSaveSliceEffect = <T>(
  trigger: SaveTrigger,
  select: MemoizedSelector<object, T>,
  key: string
) => {
  const triggerTypes = new Set(
    (trigger.on ?? []).map((creator) => creator.type)
  );
  const matchesSource = (type: string): boolean =>
    (trigger.sources ?? []).some((source) => type.startsWith(source)) &&
    !persistsNothing(type);

  const isMutation = (action: Action): boolean =>
    triggerTypes.has(action.type) || matchesSource(action.type);

  return createEffect(
    (
      actions$ = inject(Actions),
      store = inject(Store),
      database = inject(DatabaseService),
      reads = inject(ReadBeforeWriteService)
    ) => {
      let reported = false;
      return actions$.pipe(
        filter(isMutation),
        filter(() => reads.mayPersist(key)),
        withLatestFrom(store.select(select)),
        map(([, state]) => state),
        distinctUntilChanged(),
        concatMap((state) =>
          from(database.save(key, wrapVersioned(APP_VERSION, state))).pipe(
            ignoreElements(),
            catchError(() => {
              if (reported) return EMPTY;
              reported = true;
              return of(
                NotificationsActions.toast({
                  key: marker('toast.storage.write-failed'),
                  color: 'danger',
                })
              );
            })
          )
        )
      );
    },
    { functional: true }
  );
};

const hydratedFromDisk = <T>(
  actions$: Actions,
  lifecycle: SliceLifecycle<T>,
  reads: ReadBeforeWriteService,
  key: string
) =>
  actions$.pipe(
    ofType(lifecycle.loaded),
    filter(() => reads.mayPersist(key)),
    take(1)
  );

export const createTelemetrySliceEffect = <S, T>(
  spec: TelemetrySpec<S>,
  lifecycle: SliceLifecycle<T>,
  key: string
) =>
  createEffect(
    (
      actions$ = inject(Actions),
      store = inject(Store),
      reads = inject(ReadBeforeWriteService)
    ) => {
      return hydratedFromDisk(actions$, lifecycle, reads, key).pipe(
        switchMap(() => store.select(spec.select)),
        map((value) =>
          DashboardActions.report({
            source: spec.source,
            metrics: spec.metrics(value),
          })
        )
      );
    },
    { functional: true }
  );

export const createMetric =
  (key: string) =>
  (value: number | string): DashboardTelemetry['metrics'] => ({
    [key]: value,
  });

export const pickMetrics =
  <T extends DashboardTelemetry['metrics']>(...keys: readonly (keyof T)[]) =>
  (value: T): DashboardTelemetry['metrics'] =>
    Object.fromEntries(keys.map((key) => [key, value[key]]));
