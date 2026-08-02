import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { FunctionalEffect, provideEffects } from '@ngrx/effects';
import { ActionReducer, MemoizedSelector, provideState } from '@ngrx/store';
import { ResolveData } from '@angular/router';
import { MigrationStep } from '../../util/persistence/versioned';
import {
  createLoadSliceEffect,
  createSaveSliceEffect,
  createTelemetrySliceEffect,
  SaveTrigger,
  SliceLifecycle,
  TelemetrySpec,
} from './persisted-slice.effects.factory';
import { bootHydrationProvider } from './boot-hydration.provider';
import { moduleHydrationResolver } from './module-hydration.resolver';

type PersistedContext<TState, TStored, S> = {
  key: string;
  reducer: ActionReducer<TState>;
  lifecycle: SliceLifecycle<TStored>;
  select: MemoizedSelector<object, TState>;
  save?: SaveTrigger;
  telemetry?: TelemetrySpec<S>[];
  ladder?: MigrationStep[];
  hydrate?: 'route' | 'boot';
  effects?: EffectSource[];
};

type EffectSource = Type<unknown> | Record<string, FunctionalEffect>;

export type ContextBundle = {
  providers: Array<Provider | EnvironmentProviders>;
  resolve: ResolveData;
};

export function providePersistedContext<TState, TStored = TState, S = never>(
  context: PersistedContext<TState, TStored, S>
): ContextBundle {
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

export const mergeContexts = (...bundles: ContextBundle[]): ContextBundle => ({
  providers: bundles.flatMap((bundle) => bundle.providers),
  resolve: Object.assign({}, ...bundles.map((bundle) => bundle.resolve)),
});
