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
  Mode,
  MODES,
  Skin,
  SKINS,
} from '../../../@shared/model/app.types';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  APP_RELEASE,
  COPYRIGHT,
  SOURCE_URL,
} from '../../../@shared/model/app.consts';

import { SettingsFacade } from '../../data';
import { addIcons } from 'ionicons';
import {
  codeSlashOutline,
  documentTextOutline,
  gridOutline,
  informationCircleOutline,
  personOutline,
  settingsOutline,
} from 'ionicons/icons';

const SKIN_LABEL_KEYS: Record<Skin, Marker> = {
  cyberpunk: marker('settings.theme.cyberpunk'),
  boomer: marker('settings.theme.boomer'),
};

const MODE_LABEL_KEYS: Record<Mode, Marker> = {
  light: marker('settings.mode.light'),
  dark: marker('settings.mode.dark'),
};

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
};

const DEFAULT_ACCENT_SWATCHES: Record<Skin, Record<Mode, AccentColors>> = {
  cyberpunk: {
    dark: { primary: '#de8b27', secondary: '#32aea6' },
    light: { primary: '#96590a', secondary: '#166b66' },
  },
  boomer: {
    light: { primary: '#2f5bd0', secondary: '#4b6b7a' },
    dark: { primary: '#7aa2f7', secondary: '#8fa7b8' },
  },
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
      personOutline,
    });
  }

  readonly sourceUrl = SOURCE_URL;
  readonly release = APP_RELEASE;
  readonly copyright = COPYRIGHT;

  readonly #settings = inject(SettingsFacade);

  readonly skin = this.#settings.skin;
  readonly skins = SKINS;
  readonly skinLabelKeys = SKIN_LABEL_KEYS;
  readonly mode = this.#settings.mode;
  readonly modes = MODES;
  readonly modeLabelKeys = MODE_LABEL_KEYS;
  readonly languages = LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;
  readonly language = this.#settings.language;

  readonly #activeAccents = computed(
    () => this.#settings.customAccents()?.[this.skin()]
  );
  readonly #defaultAccents = computed(
    () => DEFAULT_ACCENT_SWATCHES[this.skin()][this.mode()]
  );
  readonly primarySwatch = computed(
    () => this.#activeAccents()?.primary ?? this.#defaultAccents().primary
  );
  readonly secondarySwatch = computed(
    () => this.#activeAccents()?.secondary ?? this.#defaultAccents().secondary
  );

  changeSkin(event: SegmentCustomEvent) {
    this.#settings.setSkin(event.detail.value as Skin);
  }

  changeMode(event: SegmentCustomEvent) {
    this.#settings.setMode(event.detail.value as Mode);
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
    this.#settings.resetAccentColors(this.skin());
  }

  #setAccents(colors: AccentColors) {
    this.#settings.setAccentColors(this.skin(), colors);
  }
}
