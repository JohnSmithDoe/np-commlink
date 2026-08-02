import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { filter, tap } from 'rxjs';
import { TrackplayDeleted } from '../model/trackplay.types';
import { TrackplayActions } from './trackplay.actions';
import { selectLastDeleted } from './trackplay.selector';

@Injectable({ providedIn: 'root' })
export class TrackplayEffects {
  readonly #store = inject(Store);
  readonly #toast = inject(ToastController);
  readonly #translate = inject(TranslateService);

  undoDeleteToast$ = createEffect(
    () => {
      return this.#store.select(selectLastDeleted).pipe(
        filter((stash): stash is TrackplayDeleted => stash !== null),
        tap((stash) => void this.#presentUndoToast(stash.name))
      );
    },
    { dispatch: false }
  );

  #undoToast?: HTMLIonToastElement;

  async #presentUndoToast(name: string) {
    await this.#undoToast?.dismiss(null, 'cancel');
    const toast = await this.#toast.create({
      header: this.#translate.instant(marker('trackplay.toast.undo-delete')),
      message: name,
      duration: 8000,
      position: 'bottom',
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
