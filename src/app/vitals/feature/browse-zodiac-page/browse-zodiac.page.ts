import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TodayService } from '../../../@shared/data/services/today.service';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { ZODIAC_ELEMENT_LABEL_KEYS } from '../../model/astro.consts';
import { zodiacSignFor, zodiacYear } from '../../util/zodiac.utils';

@Component({
  selector: 'app-page-vitals-browse-zodiac',
  templateUrl: './browse-zodiac.page.html',
  styleUrls: ['./browse-zodiac.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseZodiacPage {
  readonly #today = inject(TodayService).today;

  readonly elementKeys = ZODIAC_ELEMENT_LABEL_KEYS;

  readonly windows = computed(() => zodiacYear(this.#today()));

  readonly currentSign = computed(() => zodiacSignFor(this.#today())?.sign);
}
