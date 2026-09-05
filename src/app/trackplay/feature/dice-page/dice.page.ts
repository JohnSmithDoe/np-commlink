import {
  ChangeDetectionStrategy,
  Component,
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
import { diceOutline, trashOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { DiceFacade } from '../../data';
import { DIE_FACES, DieFaces, PoolRoll } from '../../model/dice.types';
import { DiceRackComponent } from '../../ui/dice-rack/dice-rack.component';
import { DiceTrayComponent } from '../../ui/dice-tray/dice-tray.component';
import { rollPool } from '../../util/dice.utils';

@Component({
  selector: 'app-page-trackplay-dice',
  templateUrl: './dice.page.html',
  styleUrls: ['./dice.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DiceRackComponent,
    DiceTrayComponent,
    EmptyStateComponent,
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

  readonly dieFaces = DIE_FACES;

  readonly dice = this.#dice.dice;
  readonly tally = this.#dice.tally;
  readonly canRoll = this.#dice.canRoll;

  readonly roll = signal<PoolRoll | null>(null);
  readonly throwId = signal(0);

  constructor() {
    addIcons({ diceOutline, trashOutline });
  }

  addDie(faces: DieFaces): void {
    this.#dice.addDie(faces);
  }

  removeDie(index: number): void {
    this.#dice.removeDieAt(index);
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
