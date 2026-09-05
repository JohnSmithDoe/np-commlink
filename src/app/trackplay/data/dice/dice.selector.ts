import { createSelector } from '@ngrx/store';
import { DiceTally, DieFaces } from '../../model/dice.types';
import { tallyDice } from '../../util/dice.utils';
import { selectDicePool } from '../trackplay.selector';

export const selectPoolDice = createSelector(
  selectDicePool,
  (pool): DieFaces[] => pool.dice
);

export const selectDiceTally = createSelector(
  selectPoolDice,
  (dice): DiceTally[] => tallyDice(dice)
);

export const selectCanRoll = createSelector(
  selectPoolDice,
  (dice): boolean => dice.length > 0
);
