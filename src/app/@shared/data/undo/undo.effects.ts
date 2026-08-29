/* ─── why ─────────────────────────────────────────────────────────
 * The toast REPORTS the delete and offers nothing: `ion-toast` is
 * `role="status"`, so a button inside it is never announced, and it lived
 * five seconds where the entry lives until its list is done with it. The
 * header button is the whole path, and being the only one is what stops a
 * five-second window and a persistent control from resolving the same
 * entry twice.
 *
 * `performed` therefore always carries the list on screen, and a scope
 * names its entry without any per-entry id. It answers with a toast of its
 * own because the button is the only feedback undo has: without one, a
 * successful restore reads as the control vanishing.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { concatMap, map } from 'rxjs';
import { newestIn } from '../../util/undo.utils';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from './undo.actions';
import { selectUndoEntries } from './undo.selector';

const UNDO_TOAST_MS = 5000;
const UNDO_TOAST_GROUP = 'undo';

export const undoEffects = {
  offerUndo$: createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(UndoActions.pushed),
        map(({ entry }) =>
          NotificationsActions.toast({
            key: marker('undo.toast.deleted'),
            parameters: { name: entry.name },
            durationMs: UNDO_TOAST_MS,
            group: UNDO_TOAST_GROUP,
          })
        )
      );
    },
    { functional: true }
  ),

  performUndo$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(UndoActions.performed),
        concatLatestFrom(() => store.select(selectUndoEntries)),
        concatMap(([{ scope }, entries]) => {
          const entry = newestIn(entries, scope);
          if (!entry) return [];
          return [
            entry.action,
            UndoActions.popped(scope),
            NotificationsActions.toast({
              key: marker('undo.toast.restored'),
              parameters: { name: entry.name },
              durationMs: UNDO_TOAST_MS,
              group: UNDO_TOAST_GROUP,
            }),
          ];
        })
      );
    },
    { functional: true }
  ),
};
