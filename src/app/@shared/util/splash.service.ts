import { Injectable } from '@angular/core';
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

  // Instantiated eagerly (ThemeEffects injects it at boot), so arming the
  // fallback in the constructor guarantees the splash lifts even if `loaded`
  // never fires.
  constructor() {
    this.#timer = setTimeout(() => this.reveal(), FALLBACK_MS);
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
