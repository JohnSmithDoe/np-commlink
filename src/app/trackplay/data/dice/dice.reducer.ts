import { createReducer, on } from '@ngrx/store';
import { DiceGroup, DicePool, TrackplayId } from '../../model/trackplay.types';
import { clampDiceCount, clampModifier } from '../../util/dice.utils';
import { initialDicePool } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { DiceActions } from './dice.actions';

const patchGroup = (
  state: DicePool,
  id: TrackplayId,
  patch: Partial<DiceGroup>
): DicePool => ({
  ...state,
  groups: state.groups.map((group) =>
    group.id === id ? { ...group, ...patch } : group
  ),
});

// prettier-ignore
export const diceReducer = createReducer(
  initialDicePool,

  on(DiceActions.addGroup, (state, { group }): DicePool => ({ ...state, groups: [...state.groups, group] })),
  on(DiceActions.setGroupFaces, (state, { id, faces }): DicePool => patchGroup(state, id, { faces })),
  on(DiceActions.setGroupCount, (state, { id, count }): DicePool => patchGroup(state, id, { count: clampDiceCount(count) })),
  on(DiceActions.removeGroup, (state, { id }): DicePool => ({ ...state, groups: state.groups.filter((group) => group.id !== id) })),
  on(DiceActions.setModifier, (state, { modifier }): DicePool => ({ ...state, modifier: clampModifier(modifier) })),
  on(DiceActions.clearPool, (): DicePool => initialDicePool),

  on(TrackplayActions.loaded, (state, { trackplay }): DicePool => ({ ...initialDicePool, ...(trackplay?.dice ?? state) }))
);
