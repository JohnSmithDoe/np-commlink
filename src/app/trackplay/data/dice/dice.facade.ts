import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { DieFaces } from '../../model/dice.types';
import { selectDicePool } from '../trackplay.selector';
import { DiceActions } from './dice.actions';
import {
  selectCanRoll,
  selectDiceTally,
  selectPoolDice,
} from './dice.selector';

@Injectable({ providedIn: 'root' })
export class DiceFacade {
  readonly #store = inject(Store);

  readonly pool = this.#store.selectSignal(selectDicePool);
  readonly dice = this.#store.selectSignal(selectPoolDice);
  readonly tally = this.#store.selectSignal(selectDiceTally);
  readonly canRoll = this.#store.selectSignal(selectCanRoll);

  addDie(faces: DieFaces): void {
    this.#store.dispatch(DiceActions.addDie(faces));
  }

  removeDieAt(index: number): void {
    this.#store.dispatch(DiceActions.removeDieAt(index));
  }

  clearPool(): void {
    this.#store.dispatch(DiceActions.clearPool());
  }
}
