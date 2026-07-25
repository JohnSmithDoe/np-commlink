import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  AlertButton,
  IonAlert,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  ToggleChangeEventDetail,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SettingsFacade } from '../../../@shared/data/settings/settings.facade';
import { TTheme } from '../../../@shared/model/types';
import { OfficeTimeFacade } from '../../data';

@Component({
  selector: 'app-page-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    IonContent,
    IonList,
    IonItem,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    IonLabel,
    IonButton,
    IonAlert,
  ],
})
export class SettingsPage {
  readonly #facade = inject(OfficeTimeFacade);
  readonly #settings = inject(SettingsFacade);
  readonly #translate = inject(TranslateService);

  readonly alertButtons: AlertButton[] = [
    {
      text: this.#translate.instant('officetime.settings.reset.cancel'),
      role: 'cancel',
      cssClass: 'alert-button-success',
    },
    {
      text: this.#translate.instant('officetime.settings.reset.confirm'),
      role: 'confirm',
      cssClass: 'alert-button-danger',
      handler: () => this.resetData(),
    },
  ];

  readonly #dashboardSettings = this.#facade.dashboardSettings;
  readonly dashboardSettings = computed(() => {
    const settings = this.#dashboardSettings();
    return settings
      ? Object.entries(settings).map(([key, value]) => ({ key, value }))
      : undefined;
  });

  readonly targetOfficeDaysPerWeek = this.#facade.targetOfficeDaysPerWeek;

  // App-wide UI theme (global `settings` slice). Changing it re-skins the whole
  // app live (SettingsEffects.applyTheme$ sets <html data-theme>).
  readonly theme = this.#settings.theme;

  readonly pinFormatter = (value: number) => `${value}`;

  changeTheme(value: TTheme) {
    this.#settings.setTheme(value);
  }

  changeDashboardSettings($event: CustomEvent<ToggleChangeEventDetail>) {
    this.#facade.saveDashboardSettings(
      $event.detail.value,
      $event.detail.checked
    );
  }

  changeTargetOfficeDaysPerWeek($event: CustomEvent<{ value: number }>) {
    this.#facade.saveTargetOfficeDaysPerWeek($event.detail.value);
  }

  resetData() {
    this.#facade.resetData();
  }
}
