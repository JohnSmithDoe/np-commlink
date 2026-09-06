import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  InputCustomEvent,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { APP_LANGUAGE } from '../../../@shared/util/theme/language.boot';
import { LADDER_STEPS, PHI } from '../../model/golden.consts';
import { GoldenAreaComponent } from '../../ui/golden-area/golden-area.component';
import { SplitBarComponent } from '../../ui/split-bar/split-bar.component';
import { formatNumber } from '../../util/convert.utils';
import {
  goldenLadder,
  goldenPoints,
  goldenSplit,
} from '../../util/golden.utils';

type GoldenView = 'divider' | 'area';

const VIEWS: ReadonlySet<GoldenView> = new Set(['divider', 'area']);

const DEPTHS = [1, 2] as const;

const HALF_STEP = 0.5;

@Component({
  selector: 'app-page-coprocessor-golden',
  templateUrl: './golden.page.html',
  styleUrl: './golden.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GoldenAreaComponent,
    SplitBarComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonSegment,
    IonSegmentButton,
    TranslatePipe,
  ],
})
export class CoprocessorGoldenPage {
  readonly #language = inject(APP_LANGUAGE);

  readonly view = signal<GoldenView>('divider');

  readonly total = signal(100);

  readonly width = signal(300);
  readonly height = signal(240);
  readonly depth = signal(1);
  readonly selected = signal('');

  readonly depths = DEPTHS;

  readonly phi = formatNumber(PHI, this.#language);

  readonly split = computed(() => goldenSplit(this.total()));
  readonly major = computed(() =>
    formatNumber(this.split().major, this.#language)
  );
  readonly minor = computed(() =>
    formatNumber(this.split().minor, this.#language)
  );

  readonly rungs = computed(() =>
    [...this.#ladder(0, false), ...this.#ladder(HALF_STEP, true)]
      .toSorted((a, b) => a.value - b.value)
      .map((rung) => ({
        ...rung,
        label: formatNumber(rung.value, this.#language),
      }))
  );

  readonly points = computed(() =>
    goldenPoints(this.width(), this.height(), this.depth())
  );

  readonly measurements = computed(() =>
    this.points().map((point) => ({
      id: point.id,
      fromLeft: formatNumber(point.fromLeft, this.#language),
      fromRight: formatNumber(point.fromRight, this.#language),
      fromTop: formatNumber(point.fromTop, this.#language),
      fromBottom: formatNumber(point.fromBottom, this.#language),
      x: formatNumber(point.fromLeft, this.#language),
      y: formatNumber(point.fromBottom, this.#language),
    }))
  );

  readonly activeId = computed(() => {
    const points = this.points();
    const held = points.find((point) => point.id === this.selected());
    return (held ?? points[0]!).id;
  });

  readonly chosen = computed(() =>
    this.measurements().find((point) => point.id === this.activeId())!
  );

  readonly ratio = computed(() => {
    const long = Math.max(this.width(), this.height());
    const short = Math.min(this.width(), this.height());
    return short === 0 ? 0 : long / short;
  });

  readonly ratioLabel = computed(() =>
    formatNumber(this.ratio(), this.#language)
  );

  readonly suggestedShort = computed(() =>
    formatNumber(Math.max(this.width(), this.height()) / PHI, this.#language)
  );

  readonly suggestedLong = computed(() =>
    formatNumber(Math.min(this.width(), this.height()) * PHI, this.#language)
  );

  constructor() {
    addIcons({ swapHorizontalOutline });
  }

  #ladder(offset: number, half: boolean) {
    return goldenLadder(this.total(), LADDER_STEPS, LADDER_STEPS, offset).map(
      (value) => ({
        value,
        half,
        base: Math.abs(value - this.total()) < 1e-9,
      })
    );
  }

  selectView(view: string | undefined): void {
    if (VIEWS.has(view as GoldenView)) this.view.set(view as GoldenView);
  }

  edit(target: 'total' | 'width' | 'height', event: InputCustomEvent): void {
    const parsed = Number(String(event.detail.value ?? '').replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    this[target].set(parsed);
  }

  selectDepth(depth: number): void {
    if (DEPTHS.includes(depth as (typeof DEPTHS)[number]))
      this.depth.set(depth);
  }

  swapSides(): void {
    const width = this.width();
    this.width.set(this.height());
    this.height.set(width);
  }
}
