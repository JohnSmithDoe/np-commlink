import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { concatMap, firstValueFrom } from 'rxjs';
import { IToastMessage } from '../../@shared/model/notifications.types';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';

const TOAST_DURATION_MS = 1500;
const DEFAULT_TOAST_COLOR = 'success';

// The one place a toast is presented. Producers dispatch the published `toast`
// contract from wherever they are (a lazy effect, a facade) and stay ignorant of
// Ionic and of i18n — the same arrangement as the persisted half of the inbox,
// minus the reducer: a toast reaches no slice and is never saved.
//
// `concatMap`, so a batch of messages queues instead of racing for the same
// footer anchor.
@Injectable({ providedIn: 'root' })
export class NotificationsToastEffects {
  readonly #actions$ = inject(Actions);
  readonly #toastController = inject(ToastController);
  readonly #translate = inject(TranslateService);

  presentToast$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(NotificationsActions.toast),
        concatMap(({ message }) => this.#present(message))
      );
    },
    { dispatch: false }
  );

  async #present(message: IToastMessage): Promise<void> {
    const toast = await this.#toastController.create({
      position: 'bottom',
      positionAnchor: 'footer',
      buttons: [
        {
          text: 'X',
          role: 'cancel',
        },
      ],
      duration: TOAST_DURATION_MS,
      color: message.color ?? DEFAULT_TOAST_COLOR,
      message: await firstValueFrom(
        this.#translate.get(message.key, message.parameters)
      ),
    });
    await toast.present();
  }
}
