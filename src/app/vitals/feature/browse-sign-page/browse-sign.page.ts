import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { TodayService } from '../../../@shared/data/services/today.service';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { ZODIAC_ELEMENT_LABEL_KEYS } from '../../model/astro.consts';
import { BrowseStepsComponent } from '../../ui/browse-steps/browse-steps.component';
import {
  astroAgeOfSign,
  zodiacNeighbours,
  zodiacSignNamed,
} from '../../util/browse.utils';
import { EraYearPipe } from '../../util/era-year.pipe';
import { zodiacYear } from '../../util/zodiac.utils';

const SIGN_ROUTE = '/vitals/browse/zodiac';

@Component({
  selector: 'app-page-vitals-browse-sign',
  templateUrl: './browse-sign.page.html',
  styleUrls: ['./browse-sign.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonContent,
    TranslatePipe,
    BrowseStepsComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PageReturnComponent,
    EraYearPipe,
  ],
})
export class VitalsBrowseSignPage {
  readonly elementKeys = ZODIAC_ELEMENT_LABEL_KEYS;

  readonly #route = inject(ActivatedRoute);
  readonly #today = inject(TodayService).today;

  readonly #name = toSignal(
    this.#route.paramMap.pipe(
      map((routeParameters) => routeParameters.get('sign') ?? '')
    ),
    { initialValue: '' }
  );

  readonly sign = computed(() => zodiacSignNamed(this.#name()));

  readonly window = computed(() => {
    const record = this.sign();
    return zodiacYear(this.#today()).find(
      (season) => season.sign.sign === record?.sign
    );
  });

  readonly age = computed(() => {
    const record = this.sign();
    return record && astroAgeOfSign(record.sign);
  });

  readonly steps = computed(() => {
    const record = this.sign();
    const neighbours = record && zodiacNeighbours(record);
    return (
      neighbours && {
        previousLink: [SIGN_ROUTE, neighbours.previous.sign],
        previousKey: neighbours.previous.nameKey,
        nextLink: [SIGN_ROUTE, neighbours.next.sign],
        nextKey: neighbours.next.nameKey,
      }
    );
  });
}
