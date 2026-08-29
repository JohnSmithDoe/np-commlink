/* ─── why ─────────────────────────────────────────────────────────
 * A dismissal is irreversible and one tap from a mis-tap, so it says so
 * immediately rather than asking first — a confirm would tax every
 * dismissal to insure the rare wrong one, on the act the feature exists to
 * make cheap.
 *
 * The way back is ZURÜCKHOLEN in settings, and that is now the only one:
 * a toast REPORTS. Its button was never announced (`ion-toast` is
 * `role="status"`) and its handler ran against whatever state had arrived
 * by the time it fired, so the capability was withdrawn rather than
 * documented.
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
      map(() =>
        NotificationsActions.toast({
          key: marker('ritual.toast.dismissed'),
          durationMs: UNDO_TOAST_MS,
          group: DISMISS_TOAST_GROUP,
        })
      )
    );
  });
}
