import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { TodayService } from '../../../@shared/data/services/today.service';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { CHINESE_ELEMENT_LABEL_KEYS } from '../../model/astro.consts';
import {
  chineseCycleAround,
  chineseYearFor,
} from '../../util/chinese-zodiac.utils';

@Component({
  selector: 'app-page-vitals-browse-chinese',
  templateUrl: './browse-chinese.page.html',
  styleUrls: ['./browse-chinese.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseChinesePage {
  readonly elementKeys = CHINESE_ELEMENT_LABEL_KEYS;

  readonly #today = inject(TodayService).today;

  readonly years = computed(() => chineseCycleAround(this.#today()));
  readonly currentYear = computed(() => chineseYearFor(this.#today()));
}
