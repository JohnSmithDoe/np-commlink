import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { DieFaces } from '../../model/dice.types';
import { TrackplayId } from '../../model/trackplay.types';
import { createDiceGroup } from '../../util/trackplay.factory';
import { selectDicePool } from '../trackplay.selector';
import { DiceActions } from './dice.actions';
import {
  selectCanRoll,
  selectDiceCount,
  selectDiceGroups,
} from './dice.selector';

@Injectable({ providedIn: 'root' })
export class DiceFacade {
  readonly #store = inject(Store);

  readonly pool = this.#store.selectSignal(selectDicePool);
  readonly groups = this.#store.selectSignal(selectDiceGroups);
  readonly diceCount = this.#store.selectSignal(selectDiceCount);
  readonly canRoll = this.#store.selectSignal(selectCanRoll);

  addGroup(faces?: DieFaces): void {
    this.#store.dispatch(DiceActions.addGroup(createDiceGroup(faces)));
  }

  setFaces(id: TrackplayId, faces: DieFaces): void {
    this.#store.dispatch(DiceActions.setGroupFaces(id, faces));
  }

  setCount(id: TrackplayId, count: number): void {
    this.#store.dispatch(DiceActions.setGroupCount(id, count));
  }

  removeGroup(id: TrackplayId): void {
    this.#store.dispatch(DiceActions.removeGroup(id));
  }

  setModifier(modifier: number): void {
    this.#store.dispatch(DiceActions.setModifier(modifier));
  }

  clearPool(): void {
    this.#store.dispatch(DiceActions.clearPool());
  }
}
