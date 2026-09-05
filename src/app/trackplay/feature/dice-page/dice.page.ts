import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, diceOutline, trashOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { DiceFacade } from '../../data';
import { DieFaces, PoolRoll } from '../../model/dice.types';
import { TrackplayId } from '../../model/trackplay.types';
import { DicePoolRowsComponent } from '../../ui/dice-pool-rows/dice-pool-rows.component';
import { DiceTrayComponent } from '../../ui/dice-tray/dice-tray.component';
import { rollPool } from '../../util/dice.utils';

@Component({
  selector: 'app-page-trackplay-dice',
  templateUrl: './dice.page.html',
  styleUrls: ['./dice.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DicePoolRowsComponent,
    DiceTrayComponent,
    EmptyStateComponent,
    NumberInputComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    TranslatePipe,
  ],
})
export class TrackplayDicePage {
  readonly #dice = inject(DiceFacade);

  readonly groups = this.#dice.groups;
  readonly canRoll = this.#dice.canRoll;
  readonly modifier = computed<number>(() => this.#dice.pool().modifier);
  readonly modifierSign = computed<string>(() =>
    this.modifier() > 0 ? '+' : '−'
  );
  readonly modifierAmount = computed<number>(() => Math.abs(this.modifier()));

  readonly roll = signal<PoolRoll | null>(null);
  readonly throwId = signal(0);

  constructor() {
    addIcons({ addOutline, diceOutline, trashOutline });
  }

  addDie(): void {
    this.#dice.addGroup();
  }

  setFaces(picked: { id: TrackplayId; faces: DieFaces }): void {
    this.#dice.setFaces(picked.id, picked.faces);
  }

  setCount(changed: { id: TrackplayId; count: number }): void {
    this.#dice.setCount(changed.id, changed.count);
  }

  removeGroup(id: TrackplayId): void {
    this.#dice.removeGroup(id);
  }

  setModifier(modifier: number): void {
    this.#dice.setModifier(modifier);
  }

  clearPool(): void {
    this.#dice.clearPool();
    this.roll.set(null);
  }

  throwDice(): void {
    if (!this.canRoll()) return;
    this.roll.set(rollPool(this.#dice.pool()));
    this.throwId.update((id) => id + 1);
  }
}
