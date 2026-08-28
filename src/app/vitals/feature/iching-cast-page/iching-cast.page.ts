/* ─── why ─────────────────────────────────────────────────────────
 * The cast is the one thing in BIOMON that is not derived from stored
 * data, so it holds no slice and survives no navigation: an oracle you
 * could reload back into is not one you threw.
 *
 * `rows` reverses the cast order because a hexagram is READ top down while
 * it is BUILT bottom up. Doing that once, in a view model, is what keeps
 * the template free of an index arithmetic that would have to agree with
 * `hexagram.utils.ts` about which end line one is — and `viewOf` resolves
 * glyph and trigrams the same way for the thrown and the transformed sign,
 * so the two cannot be drawn by different rules.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { discOutline, refreshOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { ProfilesFacade } from '../../data';
import { COIN_LABEL_KEYS, LINE_LABEL_KEYS } from '../../model/iching.consts';
import { CastLine, HexagramRecord, LineValue } from '../../model/iching.types';
import {
  castLine,
  HEXAGRAM_LINES,
  hexagramFor,
  hexagramGlyph,
  isChangingLine,
  isYangLine,
  lowerTrigramOf,
  transformedHexagramFor,
  upperTrigramOf,
} from '../../util/hexagram.utils';

interface CastRow {
  position: number;
  value: LineValue;
  yang: boolean;
  changing: boolean;
}

const viewOf = (hexagram: HexagramRecord | undefined) =>
  hexagram === undefined
    ? undefined
    : {
        record: hexagram,
        glyph: hexagramGlyph(hexagram),
        lower: lowerTrigramOf(hexagram),
        upper: upperTrigramOf(hexagram),
      };

const rowOf = (line: CastLine, index: number): CastRow => ({
  position: index + 1,
  value: line.value,
  yang: isYangLine(line.value),
  changing: isChangingLine(line.value),
});

@Component({
  selector: 'app-page-vitals-iching-cast',
  templateUrl: './iching-cast.page.html',
  styleUrls: ['./iching-cast.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsIChingCastPage {
  readonly #profiles = inject(ProfilesFacade);

  readonly returnRoute = computed(() => {
    const id = this.#profiles.routeProfile()?.id;
    return id ? `/vitals/profile/${id}/iching` : undefined;
  });

  readonly totalLines = HEXAGRAM_LINES;
  readonly lineKeys = LINE_LABEL_KEYS;
  readonly coinKeys = COIN_LABEL_KEYS;

  readonly lines = signal<readonly CastLine[]>([]);

  readonly complete = computed(() => this.lines().length === HEXAGRAM_LINES);
  readonly lastThrow = computed(() => this.lines().at(-1));
  readonly rows = computed<readonly CastRow[]>(() =>
    this.lines()
      .map((line, index) => rowOf(line, index))
      .toReversed()
  );

  readonly hexagram = computed(() => viewOf(hexagramFor(this.lines())));
  readonly transformed = computed(() =>
    viewOf(transformedHexagramFor(this.lines()))
  );
  readonly changingCount = computed(
    () => this.lines().filter((line) => isChangingLine(line.value)).length
  );

  constructor() {
    addIcons({ discOutline, refreshOutline });
  }

  throwCoins(): void {
    if (this.complete()) return;
    this.lines.update((lines) => [...lines, castLine()]);
  }

  reset(): void {
    this.lines.set([]);
  }
}
