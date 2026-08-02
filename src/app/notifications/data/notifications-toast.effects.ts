import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { concatMap, firstValueFrom } from 'rxjs';
import { ToastMessage } from '../../@shared/model/notifications.types';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';

const TOAST_DURATION_MS = 1500;
const DEFAULT_TOAST_COLOR = 'success';

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

  async #present(message: ToastMessage): Promise<void> {
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
