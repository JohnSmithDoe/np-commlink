/* ─── why ─────────────────────────────────────────────────────────
 * This watches the STORE, not `actions$`: the stash is what says a delete
 * survived its cascade, and `deleteGameType` refuses the default type
 * outright. Selecting `lastDeleted` means a refused delete is silent for
 * free, because the reference never changes.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { filter, map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { TrackplayDeleted } from '../model/trackplay.types';
import { TrackplayActions } from './trackplay.actions';
import { selectLastDeleted } from './trackplay.selector';

const UNDO_TOAST_MS = 5000;
const UNDO_TOAST_GROUP = 'trackplay-undo';

@Injectable({ providedIn: 'root' })
export class TrackplayEffects {
  readonly #store = inject(Store);

  undoDeleteToast$ = createEffect(() => {
    return this.#store.select(selectLastDeleted).pipe(
      filter((stash): stash is TrackplayDeleted => stash !== null),
      map((stash) =>
        NotificationsActions.toast({
          key: marker('trackplay.toast.undo-delete'),
          parameters: { name: stash.name },
          durationMs: UNDO_TOAST_MS,
          group: UNDO_TOAST_GROUP,
          action: {
            labelKey: marker('trackplay.toast.undo'),
            action: TrackplayActions.restoreLastDeleted(),
          },
        })
      )
    );
  });
}
