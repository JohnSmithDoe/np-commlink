/* ─── why ─────────────────────────────────────────────────────────
 * The toast carries `performed()` rather than the entry's own action, so
 * the button inside it and the toolbar button that will join it later pop
 * the same stack down one path. `group` makes each toast dismiss its
 * predecessor, which is what keeps the visible toast describing the top of
 * the stack — the entry `performed` will actually run.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { concatMap, map } from 'rxjs';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from './undo.actions';
import { selectUndoTop } from './undo.selector';

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
            action: {
              labelKey: marker('undo.action'),
              action: UndoActions.performed(),
            },
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
        concatLatestFrom(() => store.select(selectUndoTop)),
        concatMap(([, entry]) =>
          entry ? [entry.action, UndoActions.popped()] : []
        )
      );
    },
    { functional: true }
  ),
};
