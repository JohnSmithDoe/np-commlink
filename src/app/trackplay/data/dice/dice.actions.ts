import { createActionGroup, emptyProps } from '@ngrx/store';
import { DieFaces } from '../../model/dice.types';
import { DiceGroup, TrackplayId } from '../../model/trackplay.types';

export const DiceActions = createActionGroup({
  source: 'Trackplay Dice',
  events: {
    addGroup: (group: DiceGroup) => ({ group }),
    setGroupFaces: (id: TrackplayId, faces: DieFaces) => ({ id, faces }),
    setGroupCount: (id: TrackplayId, count: number) => ({ id, count }),
    removeGroup: (id: TrackplayId) => ({ id }),
    setModifier: (modifier: number) => ({ modifier }),
    clearPool: emptyProps(),
  },
});
