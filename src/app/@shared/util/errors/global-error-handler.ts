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

// A thrown value is only an `Error` by convention — a rejected promise can carry
// anything, including a string or undefined.
function reasonOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/**
 * What the app does with a failure nobody anticipated: say what broke, then offer
 * the one action that is guaranteed to work — a restart.
 *
 * Reload is the only button on purpose. Every *expected* failure already carries
 * its own `catchError` and reports through a facade (`reportScanFailure`,
 * `reportUploadFailure`, the storage-unavailable fallback), so anything arriving
 * here is by definition unanticipated — and continuing from an unknown fault is
 * how the app ends up looking fine while a subtree is dead. A restart costs
 * almost nothing besides, since every slice persists on write.
 *
 * The alert is presented through `AlertController` rather than an
 * `<ion-alert [isOpen]>` in a template, and that is the load-bearing choice: a
 * bound overlay needs a change-detection pass to open, which is exactly what
 * cannot be relied on when the error came *from* change detection. An imperative
 * Ionic overlay is a Stencil component that renders itself and calls a button's
 * `handler` as a plain callback, so it survives a broken Angular.
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  readonly #alerts = inject(AlertController);
  readonly #translate = inject(TranslateService);
  readonly #reload = inject(AppReloadService);

  // One alert per session. A `computed` that throws stays errored and re-throws
  // on every read until a dependency changes, so this fires once per change
  // detection cycle — without the guard the screen fills with alerts.
  #presented = false;

  handleError(error: unknown): void {
    // Before anything that can itself fail: on the web this is the only place the
    // stack survives, and the APK has no console to lose.
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
        // No backdrop dismiss and no cancel: dismissing would leave the app
        // looking healthy with an unknown fault still in it.
        backdropDismiss: false,
        buttons: [
          {
            text: this.#translate.instant(RELOAD),
            handler: () => this.#reload.reload(),
          },
        ],
      });
      await alert.present();
    } catch {
      // A handler that throws would re-enter Angular's error path. The console
      // line above already happened, which is the part that matters.
    }
  }
}

/**
 * Wires both halves. `provideBrowserGlobalErrorListeners` is not optional
 * garnish: Angular routes only its *own* execution into `ErrorHandler` —
 * lifecycle hooks, event handlers, change detection — so a rejected promise or a
 * raw `window.onerror` is invisible without it, and a zoneless app has no
 * `NgZone.onError` to fall back on. The async failures are the ones worth
 * catching here.
 */
export const provideGlobalErrorHandler = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]);
