import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { TTheme } from '../model/types';

// The <meta name="theme-color"> value per theme (browser/PWA chrome + Android
// status-bar tint). Cyberpunk mirrors --sr-bg; boomer mirrors the plain --sr-bg.
const THEME_COLOR: Record<TTheme, string> = {
  cyberpunk: '#0f141b',
  boomer: '#f4f6f8',
};

/**
 * Applies a theme to the document: the <html data-theme> attribute (which the
 * SCSS keys every hue + effect off), the <meta name="theme-color"> chrome, and
 * the native status-bar icon style. Store-free by design — the store→DOM bridge
 * is a theme.effect (data → util), keeping this a plain DOM util.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  apply(theme: TTheme): void {
    document.documentElement.dataset['theme'] = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[theme]);

    if (Capacitor.isNativePlatform()) {
      // Dark status-bar style = light icons (for the dark deck); Light = dark
      // icons (for the light office theme).
      void StatusBar.setStyle({
        style: theme === 'boomer' ? Style.Light : Style.Dark,
      }).catch(() => {});
    }
  }
}
