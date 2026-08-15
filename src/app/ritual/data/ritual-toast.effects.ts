/* ─── why ─────────────────────────────────────────────────────────
 * Both actions this module makes easy are irreversible and one tap from a
 * mis-tap, so each offers the way back immediately rather than asking
 * first. A confirm would tax every completion to insure the rare wrong
 * one, on the very act the feature exists to make cheap.
 *
 * The two toasts carry their own groups so a completion never silences a
 * dismissal, and the completion undo carries the stamp as well as the id
 * — a bonus puts a second row on the same day.
 *
 * Only the dismissal has a second way back (settings restores everything),
 * which is the persistent path a caller of `ToastMessage.action` owes,
 * since `ion-toast` is `role="status"` and its button is never announced.
 * A completion has no such path: it is undoable while the toast is up and
 * final after, which is the whole trade the modal used to buy.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { RitualActions } from './ritual.actions';

const UNDO_TOAST_MS = 6000;
const DISMISS_TOAST_GROUP = 'ritual-dismiss';
const COMPLETE_TOAST_GROUP = 'ritual-complete';

@Injectable({ providedIn: 'root' })
export class RitualToastEffects {
  readonly #actions$ = inject(Actions);

  undoDismissToast$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(RitualActions.dismissed),
      map(({ promptId }) =>
        NotificationsActions.toast({
          key: marker('ritual.toast.dismissed'),
          durationMs: UNDO_TOAST_MS,
          group: DISMISS_TOAST_GROUP,
          action: {
            labelKey: marker('ritual.toast.undo'),
            action: RitualActions.restored(promptId),
          },
        })
      )
    );
  });

  undoCompletionToast$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(RitualActions.completed),
      map(({ promptId, at }) =>
        NotificationsActions.toast({
          key: marker('ritual.toast.completed'),
          durationMs: UNDO_TOAST_MS,
          group: COMPLETE_TOAST_GROUP,
          action: {
            labelKey: marker('ritual.toast.undo'),
            action: RitualActions.uncompleted(promptId, at),
          },
        })
      )
    );
  });
}
