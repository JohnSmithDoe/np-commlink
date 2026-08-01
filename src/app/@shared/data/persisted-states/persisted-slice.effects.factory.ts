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
import { IDashboardTelemetry } from '../../model/dashboard.types';
import { DatabaseService } from '../../util/persistence/database.service';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';
import {
  MigrationStep,
  runMigrations,
  wrapVersioned,
} from '../../util/persistence/versioned';
import { DashboardActions } from '../actions/dashboard.actions';
import { NotificationsActions } from '../actions/notifications.actions';

export type TSliceLifecycle<T> = {
  load: ActionCreator<string, () => Action>;
  loaded: ActionCreator<string, (value: T | null) => Action>;
};

// A context declares its save trigger as action-source prefixes, an explicit
// action list, or both. `sources` is plural because a context may own several
// action groups: the combined `groceries` slice is mutated by `[Products]`,
// `[Shopping]`, `[Storage]`, `[GroceryCategories]`, `[Recipes]` and
// `[ListSettings]`.
export type TSaveTrigger = {
  sources?: string[];
  on?: { type: string }[];
};

export type TTelemetrySpec<S> = {
  source: string;
  select: MemoizedSelector<object, S>;
  metrics: (value: S) => IDashboardTelemetry['metrics'];
};

const isHydrationLifecycle = (type: string): boolean =>
  /\] (load|loaded)$/.test(type);

// A read that rejects still has to emit `loaded` — `moduleHydrationResolver`
// blocks route activation until it fires — but it must not let the resulting
// initialState fallback reach disk, so the key is withheld from the registry
// and the save effect stays muted for the rest of the session.
export const createLoadSliceEffect = <T>(
  lifecycle: TSliceLifecycle<T>,
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
  trigger: TSaveTrigger,
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
        // A mutation is an *intent* to change the slice, not evidence that it
        // did. The reducers already answer that question by returning the state
        // object unchanged on a no-op — `withList`, `updateListSearch`,
        // `setRoundValue`'s unchanged-cell guard — and without this the answer
        // stopped at the store: `[Trackplay] enterGamePage` rewrote the whole
        // doc on every game-page entry, and every blur on an unedited score
        // cell did the same.
        //
        // Reference equality is the right test rather than an approximation of
        // one: `select` is the context's own slice selector, so what it returns
        // IS the document `save` writes, and it is memoized — an unchanged
        // slice is the identical object.
        distinctUntilChanged(),
        tap((state) => {
          // Nothing to dispatch from a `dispatch: false` effect; the point is
          // that a rejected write stays a handled rejection.
          database.save(key, wrapVersioned(APP_VERSION, state)).catch(() => {});
        })
      );
    },
    { functional: true, dispatch: false }
  );
};

// The slice's own `loaded`, but only for a read that actually resolved — the
// same gate, from the same registry, that lets the save effect write.
const hydratedFromDisk = <T>(
  actions$: Actions,
  lifecycle: TSliceLifecycle<T>,
  reads: PersistedReadRegistry,
  key: string
) =>
  actions$.pipe(
    ofType(lifecycle.loaded),
    filter(() => reads.mayPersist(key)),
    take(1)
  );

/**
 * A context reports its telemetry only once its own slice has hydrated.
 *
 * `store.select` emits initialState the instant the effect registers, so a
 * subscription-triggered reporter announces a zero the deck shows as live and
 * the summary writer puts on disk over the previous session's real value —
 * permanently, if that slice's read then fails. Triggering on `loaded` instead
 * means every reported number came off disk or out of a user action, and a read
 * that rejected never opens the gate at all: the tile keeps its persisted
 * summary at `standby` ("last known"), which beats a confident zero.
 */
export const createTelemetrySliceEffect = <S, T>(
  spec: TTelemetrySpec<S>,
  lifecycle: TSliceLifecycle<T>,
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
  (value: number | string): IDashboardTelemetry['metrics'] => ({
    [key]: value,
  });
