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
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TTheme } from '../../../@shared/model/app.types';
import { IAccentColors } from '../../../@shared/model/settings.types';
import { SettingsFacade } from '../../data';
import { addIcons } from 'ionicons';
import { gridOutline, settingsOutline } from 'ionicons/icons';

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
    TranslateModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonIcon,
    RouterLink,
  ],
})
export class SettingsPage {
  constructor() {
    addIcons({ settingsOutline, gridOutline });
  }

  readonly #settings = inject(SettingsFacade);

  readonly theme = this.#settings.theme;

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

  changeTheme(value: TTheme) {
    this.#settings.setTheme(value);
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
