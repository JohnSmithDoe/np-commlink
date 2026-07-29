import {
  EnvironmentProviders,
  Injectable,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

// The neutral boot splash. On native it's the Capacitor launch screen
// (launchAutoHide:false, hidden here); on web it's the #app-splash overlay in
// index.html. One reveal() covers both, fired once the theme has hydrated.
const SPLASH_ID = 'app-splash';
const FADE_MS = 300;
// Ceiling so a stuck theme read can never leave the splash up forever
// (reveal-with-deadline — same idea as a readiness probe with a timeout).
const FALLBACK_MS = 3000;

@Injectable({ providedIn: 'root' })
export class SplashService {
  #revealed = false;
  #timer?: ReturnType<typeof setTimeout>;

  armDeadline(): void {
    this.#timer ??= setTimeout(() => this.reveal(), FALLBACK_MS);
  }

  reveal(): void {
    if (this.#revealed) return;
    this.#revealed = true;
    if (this.#timer) clearTimeout(this.#timer);

    if (Capacitor.isNativePlatform()) {
      void SplashScreen.hide({ fadeOutDuration: FADE_MS }).catch(() => {});
    }

    const element = document.querySelector<HTMLElement>(`#${SPLASH_ID}`);
    if (!element) return;
    element.classList.add('app-splash--hidden');
    setTimeout(() => element.remove(), FADE_MS);
  }
}

/**
 * Arms the reveal deadline at boot. It is a provider rather than something the
 * constructor does, because the deadline used to exist only as a side effect of
 * `SettingsEffects` happening to inject this service — so whoever stopped
 * injecting it would have silently removed the app's only guarantee that a
 * stuck theme read cannot leave the splash up forever.
 */
export const provideSplashDeadline = (): EnvironmentProviders =>
  provideAppInitializer(() => inject(SplashService).armDeadline());
