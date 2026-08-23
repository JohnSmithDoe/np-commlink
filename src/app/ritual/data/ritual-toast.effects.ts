/* ─── why ─────────────────────────────────────────────────────────
 * A dismissal is irreversible and one tap from a mis-tap, so it offers the
 * way back immediately rather than asking first — a confirm would tax every
 * dismissal to insure the rare wrong one, on the act the feature exists to
 * make cheap.
 *
 * It also has a SECOND way back, since settings restores everything. That
 * is the persistent path a caller of `ToastMessage.action` owes: `ion-toast`
 * is `role="status"`, so its button is never announced and the toast alone
 * would leave a screen reader no route at all.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { RitualActions } from './ritual.actions';

const UNDO_TOAST_MS = 6000;
const DISMISS_TOAST_GROUP = 'ritual-dismiss';

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
}
