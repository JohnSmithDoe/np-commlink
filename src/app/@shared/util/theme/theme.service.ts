import { Injectable, Signal, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IAccentColors, TTheme } from '../../model/app.types';
import { deriveIonicColorSet, IIonicColorSet } from './ionic-color.utils';

// The <meta name="theme-color"> value per theme (browser/PWA chrome + Android
// status-bar tint). Cyberpunk mirrors --sr-bg; boomer mirrors the plain --sr-bg.
const THEME_COLOR: Record<TTheme, string> = {
  cyberpunk: '#0f141b',
  boomer: '#f4f6f8',
};

type TAccentKey = keyof IAccentColors;
const ACCENT_KEYS: readonly TAccentKey[] = ['primary', 'secondary'];

// The `--ion-color-<key>` suffix for each derived value a custom accent needs.
const CSS_VAR_SUFFIX: Record<keyof IIonicColorSet, string> = {
  base: '',
  rgb: '-rgb',
  contrast: '-contrast',
  contrastRgb: '-contrast-rgb',
  shade: '-shade',
  tint: '-tint',
};

/**
 * Applies a theme to the document: the <html data-theme> attribute (which the
 * SCSS keys every hue + effect off), an optional user accent override (inline
 * CSS custom properties, which win over the SCSS rule by cascade specificity),
 * the <meta name="theme-color"> chrome, and the native status-bar icon style.
 * Store-free by design — the store→DOM bridge is a theme.effect (data → util),
 * keeping this a plain DOM util.
 *
 * It also *publishes* what it applied. The `settings` domain drives the theme,
 * but a reader in another domain may not import `SettingsFacade` (Sheriff seals
 * the domain axis), and theme-dependent content — the deck's codenames — has to
 * follow a live switch. So the applied value is mirrored onto a signal here, the
 * one layer every domain may reach; same arrangement as `LanguageModelService`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Matches `initialSettings.theme` — the value in effect between bootstrap and
  // the first `apply()`, which the boot splash covers.
  readonly #theme = signal<TTheme>('cyberpunk');
  readonly theme: Signal<TTheme> = this.#theme.asReadonly();

  apply(theme: TTheme, accents?: IAccentColors): void {
    this.#theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    this.#applyAccentOverrides(accents);
    this.#applyMetaThemeColor(theme);
    this.#applyStatusBarStyle(theme);
  }

  #applyAccentOverrides(accents?: IAccentColors): void {
    for (const key of ACCENT_KEYS) {
      this.#applyAccentColor(key, accents?.[key]);
    }
  }

  // Always clears all 6 vars first, then re-sets them only when overridden —
  // that clearing is what makes switching theme or resetting fall back to the
  // theme's own built-in swatch instead of sticking with a stale override.
  #applyAccentColor(key: TAccentKey, hex: string | undefined): void {
    const colorSet = hex ? deriveIonicColorSet(hex) : null;
    const style = document.documentElement.style;

    for (const [field, suffix] of Object.entries(CSS_VAR_SUFFIX) as [
      keyof IIonicColorSet,
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

  #applyMetaThemeColor(theme: TTheme): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[theme]);
  }

  #applyStatusBarStyle(theme: TTheme): void {
    if (!Capacitor.isNativePlatform()) return;
    // Dark status-bar style = light icons (for the dark deck); Light = dark
    // icons (for the light office theme).
    void StatusBar.setStyle({
      style: theme === 'boomer' ? Style.Light : Style.Dark,
    }).catch(() => {});
  }
}
