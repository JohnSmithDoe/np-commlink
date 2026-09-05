import { createActionGroup, emptyProps } from '@ngrx/store';
import { DieFaces } from '../../model/dice.types';

export const DiceActions = createActionGroup({
  source: 'Trackplay Dice',
  events: {
    addDie: (faces: DieFaces) => ({ faces }),
    removeDieAt: (index: number) => ({ index }),
    clearPool: emptyProps(),
  },
});
