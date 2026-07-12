import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { tap, withLatestFrom } from 'rxjs';
import { TrackplayActions } from './trackplay.actions';
import { selectLastDeleted } from './trackplay.selector';

@Injectable({ providedIn: 'root' })
export class TrackplayEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #toast = inject(ToastController);
  readonly #translate = inject(TranslateService);

  // Any destructive action stashes a snapshot into `lastDeleted`; offer a
  // single-level undo via a toast whose "Undo" button dispatches the restore.
  undoDeleteToast$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          TrackplayActions.deletePlayer,
          TrackplayActions.deleteGame,
          TrackplayActions.deleteGameType
        ),
        withLatestFrom(this.#store.select(selectLastDeleted)),
        tap(([, lastDeleted]) => {
          if (lastDeleted) void this.#presentUndoToast(lastDeleted.name);
        })
      );
    },
    { dispatch: false }
  );

  async #presentUndoToast(name: string) {
    // Only one undo toast at a time (a new delete supersedes the previous one).
    while (await this.#toast.getTop()) {
      await this.#toast.dismiss(null, 'cancel');
    }
    const toast = await this.#toast.create({
      header: this.#translate.instant(marker('trackplay.toast.undo-delete')),
      message: name,
      duration: 8000,
      position: 'bottom',
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
    await toast.present();
  }
}
