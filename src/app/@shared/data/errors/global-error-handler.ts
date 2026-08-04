import {
  EnvironmentProviders,
  ErrorHandler,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { AppReloadService } from '../service-worker/app-reload.service';

const TITLE = marker('error.uncaught.title');
const MESSAGE = marker('error.uncaught.message');
const RELOAD = marker('error.uncaught.reload');

function reasonOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  readonly #alerts = inject(AlertController);
  readonly #translate = inject(TranslateService);
  readonly #reload = inject(AppReloadService);

  #presented = false;

  handleError(error: unknown): void {
    console.error(error);
    if (this.#presented) return;
    this.#presented = true;
    void this.#present(reasonOf(error));
  }

  async #present(reason: string): Promise<void> {
    try {
      const alert = await this.#alerts.create({
        header: this.#translate.instant(TITLE),
        message: this.#translate.instant(MESSAGE, { reason }),
        backdropDismiss: false,
        buttons: [
          {
            text: this.#translate.instant(RELOAD),
            handler: () => this.#reload.reload(),
          },
        ],
      });
      await alert.present();
    } catch {}
  }
}

export const provideGlobalErrorHandler = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]);
