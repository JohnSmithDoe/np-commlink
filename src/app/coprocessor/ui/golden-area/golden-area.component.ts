/* ─── why ─────────────────────────────────────────────────────────
 * Every crossing is pickable, including the second level's, but a deeper
 * point is DRAWN smaller than it is TOUCHABLE: the visible radius shrinks
 * with the level while a transparent stroke keeps the hit area at the level
 * one size. Sizing the target with the dot would put a 3 mm circle on a
 * phone, which is a gesture nobody lands.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  goldenGuides,
  goldenPoints,
  spiralSquares,
} from '../../util/golden.utils';

@Component({
  selector: 'app-golden-area',
  templateUrl: './golden-area.component.html',
  styleUrl: './golden-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class GoldenAreaComponent {
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly depth = input.required<number>();
  readonly selected = input.required<string>();
  readonly label = input.required<string>();
  readonly pointLabel = input.required<string>();

  readonly pick = output<string>();

  readonly plan = computed(() => spiralSquares(this.width(), this.height()));

  readonly points = computed(() =>
    goldenPoints(this.width(), this.height(), this.depth())
  );

  readonly targets = computed(() =>
    this.points().map((point) => ({
      ...point,
      radius:
        (this.markerSize() / (point.level === 1 ? 1 : 3)) *
        (point.id === this.selected() ? 1.5 : 1),
    }))
  );

  readonly across = computed(() => goldenGuides(this.width(), this.depth()));
  readonly down = computed(() => goldenGuides(this.height(), this.depth()));

  readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);

  readonly markerSize = computed(
    () => Math.min(this.width(), this.height()) / 28
  );
}
