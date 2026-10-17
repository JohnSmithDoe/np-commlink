import {
  EnvironmentProviders,
  ErrorDetails,
  ErrorHandler,
  inject,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
  Service,
} from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { AppReloadService } from '../service-worker/app-reload.service';

const TITLE = marker('error.uncaught.title');
const MESSAGE = marker('error.uncaught.message');
const RELOAD = marker('error.uncaught.reload');

function reasonOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : String(error);
}

@Service()
export class GlobalErrorHandler implements ErrorHandler {
  readonly #alerts = inject(AlertController);
  readonly #translate = inject(TranslateService);
  readonly #reload = inject(AppReloadService);

  #presented = false;

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

  handleError(error: unknown): void {
    console.error(error);
    if (this.#presented) return;
    this.#presented = true;
    void this.#present(reasonOf(error));
  }

  onViewError(error: Error, details: ErrorDetails): void {
    if (!details.boundary) {
      this.handleError(error);
      return;
    }
    console.error(
      `${details.declarationType.name} failed to render; contained by ${details.boundary.type.name}`,
      error
    );
  }
}

export const provideGlobalErrorHandler = (): EnvironmentProviders => {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]);
};
