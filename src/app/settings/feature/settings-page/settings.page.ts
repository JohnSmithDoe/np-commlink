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
import type { SegmentCustomEvent } from '@ionic/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  AccentColors,
  Language,
  LANGUAGES,
  Marker,
  Theme,
  THEMES,
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

const THEME_LABEL_KEYS: Record<Theme, Marker> = {
  cyberpunk: marker('settings.theme.cyberpunk'),
  boomer: marker('settings.theme.boomer'),
};

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
};

const DEFAULT_ACCENT_SWATCHES: Record<Theme, AccentColors> = {
  cyberpunk: { primary: '#de8b27', secondary: '#32aea6' },
  boomer: { primary: '#2f5bd0', secondary: '#4b6b7a' },
};

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
    this.#settings.setTheme(event.detail.value as Theme);
  }

  changeLanguage(event: SegmentCustomEvent) {
    this.#settings.setLanguage(event.detail.value as Language);
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

  #setAccents(colors: AccentColors) {
    this.#settings.setAccentColors(this.theme(), colors);
  }
}
