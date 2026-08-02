import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Action, ActionCreator, Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';

export function moduleHydrationResolver(
  key: string,
  load: ActionCreator<string, () => Action>,
  loaded: ActionCreator
): ResolveFn<boolean> {
  return async () => {
    const reads = inject(PersistedReadRegistry);
    if (reads.mayPersist(key)) return true;

    const store = inject(Store);
    const actions$ = inject(Actions);
    const hydrated = firstValueFrom(actions$.pipe(ofType(loaded), take(1)));
    store.dispatch(load());
    await hydrated;
    return true;
  };
}
