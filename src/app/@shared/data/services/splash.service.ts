import {
  EnvironmentProviders,
  Injectable,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

const SPLASH_ID = 'app-splash';
const NATIVE_FADE_MS = 300;
const FALLBACK_MS = 3000;
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

  #fadeOutWebOverlay(): void {
    const element = document.querySelector<HTMLElement>(`#${SPLASH_ID}`);
    if (!element) return;

    const remove = (): void => element.remove();
    element.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, FADE_CEILING_MS);
    element.classList.add('app-splash--hidden');
  }
}

export const provideSplashDeadline = (): EnvironmentProviders =>
  provideAppInitializer(() => inject(SplashService).armDeadline());
