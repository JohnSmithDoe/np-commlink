import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
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
  AlertButton,
  ToggleChangeEventDetail,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SettingsActions } from '../../../@shared/data/settings/settings.actions';
import { selectTheme } from '../../../@shared/data/settings/settings.selector';
import { TTheme } from '../../../@shared/types';
import {
  OfficeTimeActions,
  selectDashboardSettings,
  selectTargetOfficeDaysPerWeek,
} from '../../data';

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
  readonly #store = inject(Store);
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

  readonly #dashboardSettings = this.#store.selectSignal(
    selectDashboardSettings
  );
  readonly dashboardSettings = computed(() => {
    const settings = this.#dashboardSettings();
    return settings
      ? Object.entries(settings).map(([key, value]) => ({ key, value }))
      : undefined;
  });

  readonly targetOfficeDaysPerWeek = this.#store.selectSignal(
    selectTargetOfficeDaysPerWeek
  );

  // App-wide UI theme (global `settings` slice). Changing it re-skins the whole
  // app live (SettingsEffects.applyTheme$ sets <html data-theme>).
  readonly theme = this.#store.selectSignal(selectTheme);

  readonly pinFormatter = (value: number) => `${value}`;

  changeTheme(value: TTheme) {
    this.#store.dispatch(SettingsActions.setTheme(value));
  }

  changeDashboardSettings($event: CustomEvent<ToggleChangeEventDetail>) {
    this.#store.dispatch(
      OfficeTimeActions.saveDashboardSettings(
        $event.detail.value,
        $event.detail.checked
      )
    );
  }

  changeTargetOfficeDaysPerWeek($event: CustomEvent<{ value: number }>) {
    this.#store.dispatch(
      OfficeTimeActions.saveTargetOfficeDaysPerWeek($event.detail.value)
    );
  }

  resetData() {
    this.#store.dispatch(OfficeTimeActions.resetData());
  }
}
