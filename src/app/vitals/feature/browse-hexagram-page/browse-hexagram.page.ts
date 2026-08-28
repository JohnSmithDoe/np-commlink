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
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { BrowseStepsComponent } from '../../ui/browse-steps/browse-steps.component';
import { hexagramNeighbours, hexagramNumbered } from '../../util/browse.utils';
import {
  hexagramGlyph,
  lowerTrigramOf,
  upperTrigramOf,
} from '../../util/hexagram.utils';

const HEXAGRAM_ROUTE = '/vitals/browse/iching';

@Component({
  selector: 'app-page-vitals-browse-hexagram',
  templateUrl: './browse-hexagram.page.html',
  styleUrls: ['./browse-hexagram.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    TranslatePipe,
    BrowseStepsComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseHexagramPage {
  readonly #route = inject(ActivatedRoute);

  readonly #number = toSignal(
    this.#route.paramMap.pipe(
      map((routeParameters) => routeParameters.get('number') ?? '')
    ),
    { initialValue: '' }
  );

  readonly hexagram = computed(() => {
    const record = hexagramNumbered(this.#number());
    return (
      record && {
        record,
        glyph: hexagramGlyph(record),
        lower: lowerTrigramOf(record),
        upper: upperTrigramOf(record),
      }
    );
  });

  readonly steps = computed(() => {
    const view = this.hexagram();
    const neighbours = view && hexagramNeighbours(view.record);
    return (
      neighbours && {
        previousLink: [HEXAGRAM_ROUTE, String(neighbours.previous.number)],
        previousKey: neighbours.previous.nameKey,
        nextLink: [HEXAGRAM_ROUTE, String(neighbours.next.number)],
        nextKey: neighbours.next.nameKey,
      }
    );
  });
}
