import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { filter, tap } from 'rxjs';
import { ITrackplayDeleted } from '../../model/trackplay.types';
import { TrackplayActions } from '../actions/trackplay.actions';
import { selectLastDeleted } from '../selectors/trackplay.selector';

@Injectable({ providedIn: 'root' })
export class TrackplayEffects {
  readonly #store = inject(Store);
  readonly #toast = inject(ToastController);
  readonly #translate = inject(TranslateService);

  /**
   * A destructive action stashes a whole-slice snapshot into `lastDeleted`; offer
   * a single-level undo via a toast whose "Undo" button dispatches the restore.
   *
   * Driven off the stash rather than off the delete actions: the reducer refuses
   * some deletes (the built-in game type), and an action-driven toast then
   * offered to restore whichever *earlier* snapshot was still lying there — right
   * button, wrong data. Every accepted delete stashes a fresh object while a
   * refused one leaves the reference untouched, so `select`'s distinct emissions
   * are exactly the deletes that happened.
   */
  undoDeleteToast$ = createEffect(
    () => {
      return this.#store.select(selectLastDeleted).pipe(
        filter((stash): stash is ITrackplayDeleted => stash !== null),
        tap((stash) => void this.#presentUndoToast(stash.name))
      );
    },
    { dispatch: false }
  );

  #undoToast?: HTMLIonToastElement;

  async #presentUndoToast(name: string) {
    // Only one undo toast at a time (a new delete supersedes the previous one),
    // and only ever *ours*: `getTop()` skips an overlay that is mid-leave, and
    // `dismiss()` on one already leaving resolves false — so the old
    // `while (await getTop()) await dismiss()` could spin on microtasks without
    // yielding the frame that would finish the animation, and it also tore down
    // other domains' toasts.
    await this.#undoToast?.dismiss(null, 'cancel');
    const toast = await this.#toast.create({
      header: this.#translate.instant(marker('trackplay.toast.undo-delete')),
      message: name,
      duration: 8000,
      position: 'bottom',
      // Named so a spec can key off *our* toast: the shell mounts one of its
      // own, and "whichever toast is presented" is not a contract.
      htmlAttributes: { 'data-testid': 'undo-toast' },
      buttons: [
        {
          side: 'start',
          text: this.#translate.instant(marker('trackplay.toast.undo')),
          role: 'destructive',
          handler: () => {
            this.#store.dispatch(TrackplayActions.restoreLastDeleted());
          },
        },
        {
          text: this.#translate.instant(marker('trackplay.toast.close')),
          role: 'cancel',
        },
      ],
    });
    this.#undoToast = toast;
    await toast.present();
  }
}
