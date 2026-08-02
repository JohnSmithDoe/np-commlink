import { Injectable, Signal, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AccentColors, Theme } from '../../model/app.types';
import { deriveIonicColorSet, IonicColorSet } from './ionic-color.utils';

const THEME_COLOR: Record<Theme, string> = {
  cyberpunk: '#0f141b',
  boomer: '#f4f6f8',
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
  readonly #theme = signal<Theme>('cyberpunk');
  readonly theme: Signal<Theme> = this.#theme.asReadonly();

  apply(theme: Theme, accents?: AccentColors): void {
    this.#theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    this.#applyAccentOverrides(accents);
    this.#applyMetaThemeColor(theme);
    this.#applyStatusBarStyle(theme);
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

  #applyMetaThemeColor(theme: Theme): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[theme]);
  }

  #applyStatusBarStyle(theme: Theme): void {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({
      style: theme === 'boomer' ? Style.Light : Style.Dark,
    }).catch(() => {});
  }
}
