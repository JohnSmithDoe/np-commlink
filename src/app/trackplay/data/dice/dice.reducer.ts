import { createReducer, on } from '@ngrx/store';
import { DicePool } from '../../model/trackplay.types';
import { withDie, withoutDieAt } from '../../util/dice.utils';
import { initialDicePool } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { DiceActions } from './dice.actions';

// prettier-ignore
export const diceReducer = createReducer(
  initialDicePool,

  on(DiceActions.addDie, (state, { faces }): DicePool => ({ dice: withDie(state.dice, faces) })),
  on(DiceActions.removeDieAt, (state, { index }): DicePool => ({ dice: withoutDieAt(state.dice, index) })),
  on(DiceActions.clearPool, (): DicePool => initialDicePool),

  on(TrackplayActions.loaded, (state, { trackplay }): DicePool => ({
    dice: (trackplay?.dice ?? state).dice ?? [],
  }))
);
