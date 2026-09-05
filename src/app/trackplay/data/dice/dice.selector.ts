import { createSelector } from '@ngrx/store';
import { DiceGroup } from '../../model/trackplay.types';
import { poolDiceCount } from '../../util/dice.utils';
import { selectDicePool } from '../trackplay.selector';

export const selectDiceGroups = createSelector(
  selectDicePool,
  (pool): DiceGroup[] => pool.groups
);

export const selectDiceCount = createSelector(selectDicePool, (pool): number =>
  poolDiceCount(pool)
);

export const selectCanRoll = createSelector(
  selectDiceCount,
  (count): boolean => count > 0
);
