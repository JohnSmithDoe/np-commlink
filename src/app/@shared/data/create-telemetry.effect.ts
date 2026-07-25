import { createEffect } from '@ngrx/effects';
import { MemoizedSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { IDashboardTelemetry } from '../model/types';
import { DashboardActions } from './dashboard/dashboard.actions';

/**
 * Factory for the telemetry-inversion effect every supplier context repeated
 * verbatim (§4, CQRS): *push* one derived metric to the shared dashboard
 * read-model. `store.select` emits the initial value on registration and on
 * every change, so this is lazy-safe — the first `report` on route entry flips
 * the deck tile standby→online while the cold-launch value comes from the
 * persisted summary.
 *
 * The domain content — the derived `createSelector` and how it maps to a
 * `metrics` object — stays in the caller; only the identical effect wiring
 * (`select → map(report)`) is collapsed here. Lives in @shared/data (type:data)
 * rather than @shared/util because it references DashboardActions, which the
 * `util → model`-only type axis forbids a util module from importing.
 *
 * This helper + DashboardActions are the ONLY shared part of the dashboard —
 * the read-model they feed is owned by `commlink/data`. That is deliberate:
 * suppliers must reach the port without being able to see its consumer.
 */
export function createTelemetryEffect<T>(
  store: Store,
  source: string,
  selector: MemoizedSelector<object, T>,
  metrics: (value: T) => IDashboardTelemetry['metrics']
) {
  return createEffect(() => {
    return store
      .select(selector)
      .pipe(
        map((value) =>
          DashboardActions.report({ source, metrics: metrics(value) })
        )
      );
  });
}

/**
 * The common single-metric projector: report one scalar under `key`. Curried so
 * the returned mapper closes over `key` (and thus reads well as
 * `metric('balance')` at the call site). Contexts that report several fields
 * from one selected value pass their own projector instead.
 */
export const metric =
  (key: string) =>
  (value: number | string): IDashboardTelemetry['metrics'] => ({
    [key]: value,
  });
