import { Injectable } from '@angular/core';

/**
 * Restarting the app, behind an injectable so a spec can assert that it was
 * asked for rather than actually reload the test runner.
 *
 * Three callers, all of them cases where continuing is not an option: the
 * language switch (`SettingsEffects.restartOnLanguageChange$` — pure pipes have
 * already cached their formatted output), applying a downloaded build
 * (`AppUpdateService` — activating a version only redirects *subsequent*
 * requests), and the last resort offered for an uncaught error
 * (`GlobalErrorHandler`).
 */
@Injectable({ providedIn: 'root' })
export class AppReloadService {
  reload(): void {
    globalThis.location.reload();
  }
}
