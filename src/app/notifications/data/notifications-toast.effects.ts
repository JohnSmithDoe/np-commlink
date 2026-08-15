/* ─── why ─────────────────────────────────────────────────────────
 * `#plainToast` and `#actionToast` are two methods rather than one with a
 * conditional `buttons` array, because `a11y-no-actionable-toast-button`
 * only sees a button object written literally inside `create({...})`. An
 * array built then passed, a spread, or a `&&` inside the array all make
 * the rule structurally blind — the suppression would go unused and the
 * gate would be inert for every future caller. Two literals keep it
 * reading both paths, and the one that earns the exception carries it.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { concatMap, firstValueFrom } from 'rxjs';
import {
  ToastAction,
  ToastMessage,
} from '../../@shared/model/notifications.types';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';

const TOAST_DURATION_MS = 1500;
const DEFAULT_TOAST_COLOR = 'accent';

@Injectable({ providedIn: 'root' })
export class NotificationsToastEffects {
  readonly #actions$ = inject(Actions);
  readonly #toastController = inject(ToastController);
  readonly #translate = inject(TranslateService);
  readonly #store = inject(Store);

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
    const toast = message.action
      ? await this.#actionToast(message, text, message.action)
      : await this.#plainToast(message, text);
    this.#trackGroup(message.group, toast);
    await toast.present();
  }

  async #plainToast(
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

  async #actionToast(
    message: ToastMessage,
    text: string,
    offered: ToastAction
  ): Promise<HTMLIonToastElement> {
    const label = await firstValueFrom(this.#translate.get(offered.labelKey));
    return this.#toastController.create({
      position: 'bottom',
      positionAnchor: 'footer',
      htmlAttributes: { 'data-testid': 'action-toast' },
      buttons: [
        // eslint-disable-next-line commlink/a11y-no-actionable-toast-button -- Accepted gap, not a false positive: ion-toast is role="status" + aria-live="polite", so this button is never announced. Any caller setting `ToastMessage.action` therefore owes a persistent path to the same action, and neither caller — trackplay's undo, the household lists' — has one. Remove this line the moment every caller does.
        {
          side: 'start',
          text: label,
          role: 'destructive',
          handler: () => {
            this.#store.dispatch(offered.action);
          },
        },
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
