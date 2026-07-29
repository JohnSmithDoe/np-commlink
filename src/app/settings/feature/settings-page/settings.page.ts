import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { SegmentCustomEvent } from '@ionic/core/dist/types/interface';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  IAccentColors,
  LANGUAGES,
  THEMES,
  TLanguage,
  TMarker,
  TTheme,
} from '../../../@shared/model/app.types';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { APP_RELEASE, SOURCE_URL } from '../../../@shared/model/app.consts';

import { SettingsFacade } from '../../data';
import { addIcons } from 'ionicons';
import {
  codeSlashOutline,
  documentTextOutline,
  gridOutline,
  informationCircleOutline,
  settingsOutline,
} from 'ionicons/icons';

// Keyed by TTheme so a new theme cannot be added without giving it a label, and
// spelled out as `marker(...)` literals because the template reads them through a
// lookup — a `'settings.theme.' + option` key would be invisible to
// `i18n:extract --clean`, which would then prune the very keys it needs.
const THEME_LABEL_KEYS: Record<TTheme, TMarker> = {
  cyberpunk: marker('settings.theme.cyberpunk'),
  boomer: marker('settings.theme.boomer'),
};

// Same arrangement for the language, and deliberately *not* translated: a
// language is always named in itself, so someone who has landed in a language
// they cannot read can still find their way out.
const LANGUAGE_LABELS: Record<TLanguage, string> = {
  de: 'Deutsch',
  en: 'English',
};

// Each theme's built-in swatch — seeds the pickers when the user has no
// override yet. Mirrors the values in src/theme/variables.scss (same kind of
// SCSS↔TS duplication `THEME_COLOR` already accepts beside `ThemeService`).
const DEFAULT_ACCENT_SWATCHES: Record<TTheme, IAccentColors> = {
  cyberpunk: { primary: '#de8b27', secondary: '#32aea6' },
  boomer: { primary: '#2f5bd0', secondary: '#4b6b7a' },
};

/**
 * App-global settings page — currently the UI theme picker. Reachable as a
 * first-class destination (side menu + commlink deck tile), not buried under
 * office-time. Changing the theme re-skins the whole app live
 * (SettingsEffects.applyTheme$ sets <html data-theme>).
 */
@Component({
  selector: 'app-page-settings',
  templateUrl: 'settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslatePipe,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonNote,
    IonSegmentButton,
    IonButton,
    IonIcon,
    RouterLink,
  ],
})
export class SettingsPage {
  constructor() {
    addIcons({
      settingsOutline,
      gridOutline,
      documentTextOutline,
      codeSlashOutline,
      informationCircleOutline,
    });
  }

  readonly sourceUrl = SOURCE_URL;
  // Reads `dev` under `ng serve` — the define only lands in a real build.
  readonly release = APP_RELEASE;

  readonly #settings = inject(SettingsFacade);

  readonly theme = this.#settings.theme;
  readonly themes = THEMES;
  readonly themeLabelKeys = THEME_LABEL_KEYS;
  readonly languages = LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;
  readonly language = this.#settings.language;

  readonly #activeAccents = computed(
    () => this.#settings.customAccents()?.[this.theme()]
  );
  readonly primarySwatch = computed(
    () =>
      this.#activeAccents()?.primary ??
      DEFAULT_ACCENT_SWATCHES[this.theme()].primary
  );
  readonly secondarySwatch = computed(
    () =>
      this.#activeAccents()?.secondary ??
      DEFAULT_ACCENT_SWATCHES[this.theme()].secondary
  );

  changeTheme(event: SegmentCustomEvent) {
    this.#settings.setTheme(event.detail.value as TTheme);
  }

  // Restarts the app — see `SettingsEffects.restartOnLanguageChange$`.
  changeLanguage(event: SegmentCustomEvent) {
    this.#settings.setLanguage(event.detail.value as TLanguage);
  }

  changePrimaryAccent(hex: string) {
    this.#setAccents({ primary: hex, secondary: this.secondarySwatch() });
  }

  changeSecondaryAccent(hex: string) {
    this.#setAccents({ primary: this.primarySwatch(), secondary: hex });
  }

  resetAccents() {
    this.#settings.resetAccentColors(this.theme());
  }

  #setAccents(colors: IAccentColors) {
    this.#settings.setAccentColors(this.theme(), colors);
  }
}
