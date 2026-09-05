/* ─── why ─────────────────────────────────────────────────────────
 * Ionicons ships one `dice` glyph, and a pool needs seven that are told
 * apart at a glance — so the silhouettes are drawn here rather than
 * registered. Each is the die seen from above: the outer polygon is its
 * profile, the inner one the face turned towards the reader, and the
 * number sits in that face rather than the bounding box, which is why
 * every shape carries its own baseline.
 *
 * Unrolled, a die shows its OWN face count, so the same component labels
 * the pool editor and the tray with no second mode.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DieFaces } from '../../model/dice.types';

type DieShape = { body: string; face: string; textY: number };

const KITE = '24,2 42,16 37,37 24,46 11,37 6,16';
const KITE_FACE = '24,12 34,20 31,33 17,33 14,20';

const DIE_SHAPES: Record<DieFaces, DieShape> = {
  4: { body: '24,4 45,42 3,42', face: '24,15 38,38 10,38', textY: 32 },
  6: {
    body: '7,7 41,7 41,41 7,41',
    face: '14,14 34,14 34,34 14,34',
    textY: 24,
  },
  8: { body: '24,2 44,24 24,46 4,24', face: '24,8 40,27 8,27', textY: 22 },
  10: { body: KITE, face: KITE_FACE, textY: 26 },
  12: {
    body: '24,3 45,18 37,43 11,43 3,18',
    face: '24,14 36,23 31,37 17,37 12,23',
    textY: 28,
  },
  20: {
    body: '24,2 43,13 43,35 24,46 5,35 5,13',
    face: '24,8 41,37 7,37',
    textY: 29,
  },
  100: { body: KITE, face: KITE_FACE, textY: 26 },
};

@Component({
  selector: 'app-trackplay-die-glyph',
  templateUrl: './die-glyph.component.html',
  styleUrls: ['./die-glyph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class DieGlyphComponent {
  readonly faces = input.required<DieFaces>();
  readonly value = input<number | null>(null);

  protected readonly shape = computed<DieShape>(() => DIE_SHAPES[this.faces()]);
  protected readonly label = computed<number>(
    () => this.value() ?? this.faces()
  );
  protected readonly long = computed<boolean>(() => this.label() > 99);
}
