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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRange,
  IonToggle,
  ToggleChangeEventDetail,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  clockTime,
  parseClock,
} from '../../../@shared/util/formatting/date-format.utils';
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
    IonInput,
    IonNote,
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

  readonly reminder = this.#facade.reminder;
  readonly reminderTime = computed(() => {
    const { hour, minute } = this.reminder();
    return clockTime(hour, minute);
  });

  readonly pinFormatter = (value: number) => `${value}`;

  toggleReminder(enabled: boolean) {
    this.#facade.setReminder({ ...this.reminder(), enabled });
  }

  setReminderTime(value: string | number | null | undefined) {
    if (typeof value !== 'string') return;
    const clock = parseClock(value);
    if (!clock) return;
    this.#facade.setReminder({ ...this.reminder(), ...clock });
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
