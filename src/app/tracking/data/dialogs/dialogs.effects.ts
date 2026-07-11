import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { IAppState } from '../../../@shared/types';

import { dialogsActions } from './dialogs.actions';
import { selectEditState } from './dialogs.selector';
import { trackingActions } from '../tracking.actions';
import { createTrackingItem } from '../../../@shared/util/app.factory';

@Injectable({ providedIn: 'root' })
export class DialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  confirmItemChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(dialogsActions.confirmChanges),
      withLatestFrom(this.#store.select(selectEditState)),
      mergeMap(([_, state]) =>
        state.item ? of(trackingActions.addOrUpdateItem(state.item)) : EMPTY
      )
    );
  });

  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(dialogsActions.showCreateDialogWithSearch),
      withLatestFrom(this.#store),
      map(([, state]: [unknown, IAppState]) => {
        const name = state.tracking.searchQuery ?? '';
        const item = createTrackingItem(name);
        return dialogsActions.showEditDialog(item);
      })
    );
  });

  showCreateDialogWithTicket$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(dialogsActions.showCreateByTicketDialog),
      withLatestFrom(this.#store),
      map(([, state]: [unknown, IAppState]) => {
        const name = 'new ticket';
        const item = createTrackingItem(name);
        return dialogsActions.showEditDialog(item);
      })
    );
  });
}
