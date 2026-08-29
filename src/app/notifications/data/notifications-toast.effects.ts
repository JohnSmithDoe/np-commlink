/* ─── why ─────────────────────────────────────────────────────────
 * A toast REPORTS and offers nothing but dismissal. `ion-toast` is
 * `role="status"`, so any button in one is never announced, and a handler
 * fires whenever the tap lands — against state that has since moved. Both
 * were live traps rather than gaps to document, so the capability is gone
 * and `a11y-no-actionable-toast-button` now has nothing to suppress.
 *
 * The `buttons` array stays written literally inside `create({...})`: that
 * is the only shape the rule can read, and an array built then passed
 * would make the gate inert for the next caller who tries.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { concatMap, firstValueFrom } from 'rxjs';
import { ToastMessage } from '../../@shared/model/notifications.types';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';

const TOAST_DURATION_MS = 1500;
const DEFAULT_TOAST_COLOR = 'accent';

@Injectable({ providedIn: 'root' })
export class NotificationsToastEffects {
  readonly #actions$ = inject(Actions);
  readonly #toastController = inject(ToastController);
  readonly #translate = inject(TranslateService);

  readonly #grouped = new Map<string, HTMLIonToastElement>();

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
    const text = await firstValueFrom(
      this.#translate.get(message.key, message.parameters)
    );
    await this.#dismissIncumbent(message.group);
    const toast = await this.#toast(message, text);
    this.#trackGroup(message.group, toast);
    await toast.present();
  }

  async #toast(
    message: ToastMessage,
    text: string
  ): Promise<HTMLIonToastElement> {
    return this.#toastController.create({
      position: 'bottom',
      positionAnchor: 'footer',
      buttons: [
        {
          text: 'X',
          role: 'cancel',
        },
      ],
      duration: message.durationMs ?? TOAST_DURATION_MS,
      color: message.color ?? DEFAULT_TOAST_COLOR,
      message: text,
    });
  }

  async #dismissIncumbent(group?: string): Promise<void> {
    if (!group) return;
    await this.#grouped.get(group)?.dismiss(null, 'cancel');
    this.#grouped.delete(group);
  }

  #trackGroup(group: string | undefined, toast: HTMLIonToastElement): void {
    if (!group) return;
    this.#grouped.set(group, toast);
    void toast.onDidDismiss().then(() => {
      if (this.#grouped.get(group) === toast) this.#grouped.delete(group);
    });
  }
}
