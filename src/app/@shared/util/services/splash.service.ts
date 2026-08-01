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
// The native launch screen's own fade. NOT a mirror of the web overlay's CSS —
// that one is removed on `transitionend`, so the stylesheet owns its duration and
// there is no second copy of it to keep in agreement.
const NATIVE_FADE_MS = 300;
// Ceiling so a stuck theme read can never leave the splash up forever
// (reveal-with-deadline — same idea as a readiness probe with a timeout).
const FALLBACK_MS = 3000;
// Net for a fade that never starts — an unrendered element or a UA with
// transitions off fires no `transitionend`. Deliberately unequal to the CSS
// duration: a ceiling is not a mirror, which is the point of removing the mirror.
const FADE_CEILING_MS = 1000;

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

    this.#hideNativeLaunchScreen();
    this.#fadeOutWebOverlay();
  }

  #hideNativeLaunchScreen(): void {
    if (!Capacitor.isNativePlatform()) return;
    void SplashScreen.hide({ fadeOutDuration: NATIVE_FADE_MS }).catch(() => {});
  }

  // Listener before the class, so the transition cannot start unobserved.
  // Removing an already-detached node is a no-op, so the net needs no guard.
  #fadeOutWebOverlay(): void {
    const element = document.querySelector<HTMLElement>(`#${SPLASH_ID}`);
    if (!element) return;

    const remove = (): void => element.remove();
    element.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, FADE_CEILING_MS);
    element.classList.add('app-splash--hidden');
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
