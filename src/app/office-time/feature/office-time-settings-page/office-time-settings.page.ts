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
  IonToggle,
  ToggleChangeEventDetail,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { OfficeTimeFacade } from '../../data';
import {
  DASHBOARD_SETTING_LABEL_KEYS,
  DashboardSettingsType,
} from '../../model/office-time.types';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-page-office-time-settings',
  templateUrl: 'office-time-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslatePipe,
    IonContent,
    IonList,
    IonItem,
    IonRange,
    IonToggle,
    IonLabel,
    IonButton,
    IonAlert,
  ],
})
export class OfficeTimeSettingsPage {
  constructor() {
    addIcons({ settingsOutline });
  }

  readonly #facade = inject(OfficeTimeFacade);
  readonly #translate = inject(TranslateService);

  readonly alertButtons: AlertButton[] = [
    {
      text: this.#translate.instant(
        marker('office-time.page.settings.reset.cancel')
      ),
      role: 'cancel',
      cssClass: 'alert-button-success',
    },
    {
      text: this.#translate.instant(
        marker('office-time.page.settings.reset.confirm')
      ),
      role: 'confirm',
      cssClass: 'alert-button-danger',
      handler: () => this.resetData(),
    },
  ];

  readonly #dashboardSettings = this.#facade.dashboardSettings;
  readonly dashboardSettings = computed(() => {
    const settings = this.#dashboardSettings();
    if (!settings) return;
    return (Object.keys(settings) as DashboardSettingsType[]).map((key) => ({
      key,
      value: settings[key],
      labelKey: DASHBOARD_SETTING_LABEL_KEYS[key],
    }));
  });

  readonly targetOfficeDaysPerWeek = this.#facade.targetOfficeDaysPerWeek;

  readonly pinFormatter = (value: number) => `${value}`;

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
