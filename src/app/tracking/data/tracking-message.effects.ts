/* ─── why ─────────────────────────────────────────────────────────
 * One toast left of four. A create or an edit lands in the list the user is
 * looking at, and a delete now carries its own undo toast, so all three
 * confirmed what the screen already said. `saveAndResetTracking` is the one
 * write whose result is somewhere else — the archive — so it is the one that
 * still says so.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { TrackingActions } from './tracking.actions';

@Injectable()
export class TrackingMessageEffects {
  readonly #actions$ = inject(Actions);

  savedSuccess$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.saveAndResetTracking),
      map(() => NotificationsActions.toast({ key: marker('toast.saved') }))
    );
  });
}
