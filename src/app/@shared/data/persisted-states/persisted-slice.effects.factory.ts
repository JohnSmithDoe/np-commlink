import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import {
  catchError,
  distinctUntilChanged,
  filter,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { APP_VERSION } from '../../model/app.consts';
import { DashboardTelemetry } from '../../model/dashboard.types';
import { DatabaseService } from '../../util/persistence/database.service';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';
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

const isHydrationLifecycle = (type: string): boolean =>
  /\] (load|loaded)$/.test(type);

export const createLoadSliceEffect = <T>(
  lifecycle: SliceLifecycle<T>,
  key: string,
  ladder: MigrationStep[] = []
) =>
  createEffect(
    (
      actions$ = inject(Actions),
      database = inject(DatabaseService),
      reads = inject(PersistedReadRegistry)
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
    !isHydrationLifecycle(type);

  const isMutation = (action: Action): boolean =>
    triggerTypes.has(action.type) || matchesSource(action.type);

  return createEffect(
    (
      actions$ = inject(Actions),
      store = inject(Store),
      database = inject(DatabaseService),
      reads = inject(PersistedReadRegistry)
    ) => {
      return actions$.pipe(
        filter(isMutation),
        filter(() => reads.mayPersist(key)),
        withLatestFrom(store.select(select)),
        map(([, state]) => state),
        distinctUntilChanged(),
        tap((state) => {
          database.save(key, wrapVersioned(APP_VERSION, state)).catch(() => {});
        })
      );
    },
    { functional: true, dispatch: false }
  );
};

const hydratedFromDisk = <T>(
  actions$: Actions,
  lifecycle: SliceLifecycle<T>,
  reads: PersistedReadRegistry,
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
      reads = inject(PersistedReadRegistry)
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
