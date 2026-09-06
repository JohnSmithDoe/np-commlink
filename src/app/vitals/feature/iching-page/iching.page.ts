import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { discOutline, layersOutline } from 'ionicons/icons';
import { TodayService } from '../../../@shared/data/services/today.service';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ProfilesFacade } from '../../data';
import {
  birthDigitSumFor,
  kiStarFor,
  kiYearFor,
  lifeNumberFor,
} from '../../util/iching.utils';

@Component({
  selector: 'app-page-vitals-iching',
  templateUrl: './iching.page.html',
  styleUrls: ['./iching.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
    DateInputComponent,
  ],
})
export class VitalsIChingPage {
  readonly #profiles = inject(ProfilesFacade);

  readonly today = inject(TodayService).today;
  readonly #routeProfile = this.#profiles.routeProfile;
  readonly profile = computed(
    () => this.#routeProfile() ?? this.#profiles.favoriteProfile()
  );
  readonly date = linkedSignal(() => this.profile()?.birthDate ?? this.today());

  readonly star = computed(() => kiStarFor(this.date()));
  readonly kiYear = computed(() => kiYearFor(this.date()));
  readonly lifeNumber = computed(() => lifeNumberFor(this.date()));
  readonly digitSum = computed(() => birthDigitSumFor(this.date()));

  readonly todayStar = computed(() => kiStarFor(this.today()));
  readonly todayKiYear = computed(() => kiYearFor(this.today()));

  readonly castHref = computed(() => {
    const id = this.#routeProfile()?.id;
    return id ? `/vitals/profiles/${id}/iching/cast` : '/vitals/iching/cast';
  });
  readonly returnRoute = computed(() => {
    const id = this.#routeProfile()?.id;
    return id ? `/vitals/profiles/${id}` : undefined;
  });

  constructor() {
    addIcons({ discOutline, layersOutline });
  }
}
