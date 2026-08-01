import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { FunctionalEffect, provideEffects } from '@ngrx/effects';
import { ActionReducer, MemoizedSelector, provideState } from '@ngrx/store';
import { ResolveData } from '@angular/router';
import { MigrationStep } from '../../util/persistence/versioned';
import {
  createLoadSliceEffect,
  createSaveSliceEffect,
  createTelemetrySliceEffect,
  TSaveTrigger,
  TSliceLifecycle,
  TTelemetrySpec,
} from './persisted-slice.effects.factory';
import { bootHydrationProvider } from './boot-hydration.provider';
import { moduleHydrationResolver } from './module-hydration.resolver';

// `TState` is the shape the store holds; `TStored` is the shape on disk, which
// is usually the same but need not be — office-time persists its dayjs date maps
// as serialized strings, so its `loaded` payload is the storage shape while its
// reducer and selectors work in the runtime one. `S` is whatever the telemetry
// selector derives, independent of both (cash a scalar, office-time a stats
// projection).
type TPersistedContext<TState, TStored, S> = {
  key: string;
  reducer: ActionReducer<TState>;
  lifecycle: TSliceLifecycle<TStored>;
  select: MemoizedSelector<object, TState>;
  save?: TSaveTrigger;
  // A list because one context can supply several deck tiles: the combined
  // `groceries` slice reports a product count, an active-shopping count, a
  // low-stock count and a recipe count, one tile each.
  telemetry?: TTelemetrySpec<S>[];
  ladder?: MigrationStep[];
  hydrate?: 'route' | 'boot';
  effects?: TEffectSource[];
};

type TEffectSource = Type<unknown> | Record<string, FunctionalEffect>;

export type TContextBundle = {
  providers: Array<Provider | EnvironmentProviders>;
  resolve: ResolveData;
};

export function providePersistedContext<TState, TStored = TState, S = never>(
  context: TPersistedContext<TState, TStored, S>
): TContextBundle {
  const {
    key,
    reducer,
    lifecycle,
    select,
    save,
    telemetry,
    ladder,
    effects,
    hydrate = 'route',
  } = context;

  const sliceEffects: Record<string, FunctionalEffect> = {
    [`load_${key}$`]: createLoadSliceEffect(lifecycle, key, ladder),
  };
  if (save) {
    sliceEffects[`save_${key}$`] = createSaveSliceEffect(save, select, key);
  }
  for (const spec of telemetry ?? []) {
    sliceEffects[`report_${spec.source}$`] = createTelemetrySliceEffect(
      spec,
      lifecycle,
      key
    );
  }

  return {
    providers: [
      provideState(key, reducer),
      provideEffects(sliceEffects),
      ...(effects?.length ? [provideEffects(...effects)] : []),
      ...(hydrate === 'boot' ? [bootHydrationProvider(lifecycle.load)] : []),
    ],
    resolve:
      hydrate === 'route'
        ? {
            [key]: moduleHydrationResolver(
              key,
              lifecycle.load,
              lifecycle.loaded
            ),
          }
        : {},
  };
}

export const mergeContexts = (
  ...bundles: TContextBundle[]
): TContextBundle => ({
  providers: bundles.flatMap((bundle) => bundle.providers),
  resolve: Object.assign({}, ...bundles.map((bundle) => bundle.resolve)),
});
