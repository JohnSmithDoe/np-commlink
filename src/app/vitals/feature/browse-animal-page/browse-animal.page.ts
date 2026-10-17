import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { TodayService } from '../../../@shared/data/services/today.service';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import {
  CHINESE_ELEMENT_LABEL_KEYS,
  CHINESE_POLARITY_LABEL_KEYS,
} from '../../model/astro.consts';
import { BrowseStepsComponent } from '../../ui/browse-steps/browse-steps.component';
import { chineseNeighbours, chineseSignNamed } from '../../util/browse.utils';
import {
  chineseCycleAround,
  chineseElementOfYear,
  chineseYearFor,
  sexagenaryYearsOf,
} from '../../util/chinese-zodiac.utils';

const ANIMAL_ROUTE = '/vitals/browse/chinese';

@Component({
  selector: 'app-page-vitals-browse-animal',
  templateUrl: './browse-animal.page.html',
  styleUrls: ['./browse-animal.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    TranslatePipe,
    BrowseStepsComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseAnimalPage {
  readonly #route = inject(ActivatedRoute);

  readonly #today = inject(TodayService).today;

  readonly #name = toSignal(
    this.#route.paramMap.pipe(
      map((routeParameters) => routeParameters.get('animal') ?? '')
    ),
    { initialValue: '' }
  );

  readonly elementKeys = CHINESE_ELEMENT_LABEL_KEYS;

  readonly polarityKeys = CHINESE_POLARITY_LABEL_KEYS;

  readonly sign = computed(() => chineseSignNamed(this.#name()));

  readonly window = computed(() => {
    const record = this.sign();
    return chineseCycleAround(this.#today()).find(
      (lunar) => lunar.sign.animal === record?.animal
    );
  });

  readonly currentYear = computed(() => chineseYearFor(this.#today()));

  readonly elementYears = computed(() => {
    const record = this.sign();
    return record
      ? sexagenaryYearsOf(record.animal, this.#today()).map((year) => {
          return {
            year,
            element: chineseElementOfYear(year),
          };
        })
      : [];
  });

  readonly steps = computed(() => {
    const record = this.sign();
    const neighbours = record && chineseNeighbours(record);
    return (
      neighbours && {
        previousLink: [ANIMAL_ROUTE, neighbours.previous.animal],
        previousKey: neighbours.previous.nameKey,
        nextLink: [ANIMAL_ROUTE, neighbours.next.animal],
        nextKey: neighbours.next.nameKey,
      }
    );
  });
}
