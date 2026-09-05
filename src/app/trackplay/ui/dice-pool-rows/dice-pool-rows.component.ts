import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  InputCustomEvent,
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, removeOutline } from 'ionicons/icons';
import { parseNumberInput } from '../../../@shared/util/app.utils';
import { DIE_FACES, DieFaces } from '../../model/dice.types';
import { DiceGroup, TrackplayId } from '../../model/trackplay.types';
import { DieGlyphComponent } from '../die-glyph/die-glyph.component';

@Component({
  selector: 'app-trackplay-dice-pool-rows',
  templateUrl: './dice-pool-rows.component.html',
  styleUrls: ['./dice-pool-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DieGlyphComponent,
    IonButton,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
})
export class DicePoolRowsComponent {
  readonly groups = input.required<readonly DiceGroup[]>();

  readonly facesPicked = output<{ id: TrackplayId; faces: DieFaces }>();
  readonly countChanged = output<{ id: TrackplayId; count: number }>();
  readonly removed = output<TrackplayId>();

  readonly dieFaces = DIE_FACES;

  constructor() {
    addIcons({ addOutline, closeOutline, removeOutline });
  }

  onCount(id: TrackplayId, event: InputCustomEvent): void {
    this.countChanged.emit({ id, count: parseNumberInput(event) });
  }
}
