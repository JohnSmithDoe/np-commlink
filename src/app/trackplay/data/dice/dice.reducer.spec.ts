import {
  mockDiceGroup,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { initialDicePool } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { DiceActions } from './dice.actions';
import { diceReducer } from './dice.reducer';

const poolOf = (...groups: ReturnType<typeof mockDiceGroup>[]) => ({
  ...initialDicePool,
  groups,
});

describe('diceReducer', () => {
  it('starts with an empty pool', () => {
    expect(initialDicePool).toEqual({ groups: [], modifier: 0 });
  });

  it('appends a group', () => {
    const group = mockDiceGroup({ id: 'd20', faces: 20, count: 1 });

    const state = diceReducer(initialDicePool, DiceActions.addGroup(group));

    expect(state.groups).toEqual([group]);
  });

  it('clamps a count below one', () => {
    const state = diceReducer(
      poolOf(mockDiceGroup()),
      DiceActions.setGroupCount('dice-1', 0)
    );

    expect(state.groups[0].count).toBe(1);
  });

  it('changes only the group it names', () => {
    const state = diceReducer(
      poolOf(mockDiceGroup(), mockDiceGroup({ id: 'dice-2', faces: 20 })),
      DiceActions.setGroupFaces('dice-2', 12)
    );

    expect(state.groups.map((group) => group.faces)).toEqual([6, 12]);
  });

  it('removes a group by id', () => {
    const state = diceReducer(
      poolOf(mockDiceGroup(), mockDiceGroup({ id: 'dice-2' })),
      DiceActions.removeGroup('dice-1')
    );

    expect(state.groups.map((group) => group.id)).toEqual(['dice-2']);
  });

  it('clears back to the initial pool', () => {
    const state = diceReducer(
      { groups: [mockDiceGroup()], modifier: 4 },
      DiceActions.clearPool()
    );

    expect(state).toEqual(initialDicePool);
  });

  it('hydrates a document written before the pool existed', () => {
    const stored = mockTrackplayState();
    delete (stored as Partial<typeof stored>).dice;

    const state = diceReducer(initialDicePool, TrackplayActions.loaded(stored));

    expect(state).toEqual(initialDicePool);
  });
});
