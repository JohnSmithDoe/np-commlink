import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DieFaces } from '../../model/dice.types';
import { DieGlyphComponent } from '../die-glyph/die-glyph.component';

@Component({
  selector: 'app-trackplay-dice-rack',
  templateUrl: './dice-rack.component.html',
  styleUrls: ['./dice-rack.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DieGlyphComponent, TranslatePipe],
})
export class DiceRackComponent {
  readonly dice = input.required<readonly DieFaces[]>();
  readonly labelKey = input.required<string>();

  readonly picked = output<{ index: number; faces: DieFaces }>();
}
