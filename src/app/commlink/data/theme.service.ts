import { Injectable, Signal, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AccentColors, Mode, Skin } from '../../@shared/model/app.types';
import { deriveIonicColorSet, IonicColorSet } from '../util/ionic-color.utils';

const THEME_COLOR: Record<Mode, string> = {
  light: '#f4f6f8',
  dark: '#0f141b',
};

type AccentKey = keyof AccentColors;
const ACCENT_KEYS: readonly AccentKey[] = ['primary', 'secondary'];

const CSS_VAR_SUFFIX: Record<keyof IonicColorSet, string> = {
  base: '',
  rgb: '-rgb',
  contrast: '-contrast',
  contrastRgb: '-contrast-rgb',
  shade: '-shade',
  tint: '-tint',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #skin = signal<Skin>('cyberpunk');
  readonly #mode = signal<Mode>('dark');
  readonly skin: Signal<Skin> = this.#skin.asReadonly();
  readonly mode: Signal<Mode> = this.#mode.asReadonly();

  apply(skin: Skin, mode: Mode, accents?: AccentColors): void {
    this.#skin.set(skin);
    this.#mode.set(mode);
    document.documentElement.dataset['skin'] = skin;
    document.documentElement.dataset['mode'] = mode;
    this.#applyAccentOverrides(accents);
    this.#applyMetaThemeColor(mode);
    this.#applyStatusBarStyle(mode);
  }

  #applyAccentOverrides(accents?: AccentColors): void {
    for (const key of ACCENT_KEYS) {
      this.#applyAccentColor(key, accents?.[key]);
    }
  }

  #applyAccentColor(key: AccentKey, hex: string | undefined): void {
    const colorSet = hex ? deriveIonicColorSet(hex) : null;
    const style = document.documentElement.style;

    for (const [field, suffix] of Object.entries(CSS_VAR_SUFFIX) as [
      keyof IonicColorSet,
      string,
    ][]) {
      const name = `--ion-color-${key}${suffix}`;
      if (colorSet) {
        style.setProperty(name, colorSet[field]);
      } else {
        style.removeProperty(name);
      }
    }
  }

  #applyMetaThemeColor(mode: Mode): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[mode]);
  }

  #applyStatusBarStyle(mode: Mode): void {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({
      style: mode === 'light' ? Style.Light : Style.Dark,
    }).catch(() => {});
  }
}
