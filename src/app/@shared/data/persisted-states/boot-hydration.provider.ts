import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';

import { Action, ActionCreator, Store } from '@ngrx/store';

export function bootHydrationProvider(
  load: ActionCreator<string, () => Action>
): EnvironmentProviders {
  return provideAppInitializer(() => inject(Store).dispatch(load()));
}
