/* ─── why ─────────────────────────────────────────────────────────
 * Decoration with no reading: the host is `aria-hidden` and inert to the
 * pointer, so a celebration never lands in the accessibility tree or eats
 * a tap meant for the button underneath. Geometry is computed HERE rather
 * than by `nth-child`, because a stylesheet cannot count — the sparks
 * carried a `+3` offset that broke when anything was inserted before
 * them, then a fixed column list that silently stacked every extra piece.
 * The consumer sets how far a piece falls with `--confetti-distance`.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

type Spark = {
  left: string;
  size: string;
  delay: string;
  duration: string;
};

const EDGE_INSET = 2;
const sparkAt = (index: number, count: number): Spark => {
  const step = count > 1 ? (100 - EDGE_INSET * 2) / (count - 1) : 0;
  const nth = index + 1;
  return {
    left: `${EDGE_INSET + index * step}%`,
    size: `${4 + (nth % 3) * 2}px`,
    delay: `${(nth % 5) * 0.42 + (nth % 2) * 0.15}s`,
    duration: `${1.9 + (nth % 4) * 0.4}s`,
  };
};

@Component({
  selector: 'app-confetti',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confetti.component.html',
  styleUrl: './confetti.component.scss',
  host: { 'aria-hidden': 'true' },
})
export class ConfettiComponent {
  readonly pieces = input(14);

  protected readonly sparks = computed<Spark[]>(() => {
    const count = Math.max(this.pieces(), 0);
    return Array.from({ length: count }, (_, index) => sparkAt(index, count));
  });
}
