import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRouterLink,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { DashButtonComponent } from '../../smart-ui/dash-button/dash-button.component';
import { DashCardSkeletonComponent } from '../../ui/dash-card-skeleton/dash-card-skeleton.component';
import { DashDateComponent } from '../../ui/dash-date/dash-date.component';
import { DashDaysListComponent } from '../../ui/dash-days-list/dash-days-list.component';
import { DashFreedaysEditComponent } from '../../smart-ui/dash-freedays-edit/dash-freedays-edit.component';
import { DashHolidaysComponent } from '../../ui/dash-holidays/dash-holidays.component';
import { DashOfficeDaysEditComponent } from '../../smart-ui/dash-office-days-edit/dash-office-days-edit.component';
import { add, remove, settingsSharp } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { OfficeTimeFacade } from '../../data';
import { DashStatsComponent } from '../../ui/dash-stats/dash-stats.component';
import { DashWordclockComponent } from '../../ui/dash-wordclock/dash-wordclock.component';

@Component({
  selector: 'app-page-office-time',
  templateUrl: 'office-time-page.component.html',
  styleUrls: ['office-time-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IonContent,
    TranslateModule,
    DashButtonComponent,
    DashCardSkeletonComponent,
    DashDateComponent,
    DashDaysListComponent,
    DashFreedaysEditComponent,
    DashHolidaysComponent,
    DashOfficeDaysEditComponent,
    DashStatsComponent,
    DashWordclockComponent,
    IonButton,
    IonIcon,
    IonRouterLink,
    RouterLink,
  ],
})
export class OfficeTimePage implements ViewWillEnter {
  readonly #facade = inject(OfficeTimeFacade);

  readonly holidays = this.#facade.holidays;

  readonly holidates = this.#facade.holidayDays;
  readonly officedays = this.#facade.officedays;
  readonly freedays = this.#facade.freedays;
  readonly statsWeek = this.#facade.statsWeek;

  readonly statsMonth = this.#facade.statsMonth;
  readonly statsQuarter = this.#facade.statsQuarter;
  readonly statsYear = this.#facade.statsYear;
  readonly dashboardSettings = this.#facade.dashboardSettings;

  readonly dashboardItems = this.#facade.dashboardItems;
  readonly visibleDashboardItems = computed(() => {
    const items = this.dashboardItems();
    const settings = this.dashboardSettings();
    if (!items || !settings) return [];
    return items.filter((item) => {
      switch (item) {
        case 'date': {
          return settings.showDateCard;
        }
        case 'button': {
          return true;
        }
        case 'wordclock': {
          return settings.showWordclockCard;
        }
        case 'officedays-list': {
          return settings.showOfficedaysCardList;
        }
        case 'officedays-edit': {
          return settings.showOfficedaysCardEdit;
        }
        case 'freedays-list': {
          return settings.showFreedaysCardList;
        }
        case 'freedays-edit': {
          return settings.showFreedaysCardEdit;
        }
        case 'stats-year': {
          return settings.showStatsYear;
        }
        case 'stats-quarter': {
          return settings.showStatsQuarter;
        }
        case 'stats-month': {
          return settings.showStatsMonth;
        }
        case 'stats-week': {
          return settings.showStatsWeek;
        }
        case 'holidays': {
          return settings.showHolidaysCard;
        }
        default: {
          return false;
        }
      }
    });
  });

  constructor() {
    addIcons({ add, remove, settingsSharp });
  }

  ionViewWillEnter(): void {
    this.#facade.initOfficeTime();
  }
}
