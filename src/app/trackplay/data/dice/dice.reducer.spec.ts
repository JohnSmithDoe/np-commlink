import { DicePool } from '../../model/trackplay.types';
import { mockTrackplayState } from '../../testing/trackplay.test-data';
import { initialDicePool } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { DiceActions } from './dice.actions';
import { diceReducer } from './dice.reducer';

const tableOf = (...dice: DicePool['dice']): DicePool => ({ dice });

describe('diceReducer', () => {
  it('starts with an empty table', () => {
    expect(initialDicePool).toEqual({ dice: [] });
  });

  it('puts a die on the table', () => {
    const state = diceReducer(initialDicePool, DiceActions.addDie(20));

    expect(state.dice).toEqual([20]);
  });

  it('takes back exactly the die tapped', () => {
    const state = diceReducer(tableOf(6, 6, 20), DiceActions.removeDieAt(1));

    expect(state.dice).toEqual([6, 20]);
  });

  it('clears back to an empty table', () => {
    const state = diceReducer(tableOf(6), DiceActions.clearPool());

    expect(state).toEqual(initialDicePool);
  });

  it('hydrates a document written before the table existed', () => {
    const stored = mockTrackplayState();
    delete (stored as Partial<typeof stored>).dice;

    const state = diceReducer(initialDicePool, TrackplayActions.loaded(stored));

    expect(state).toEqual(initialDicePool);
  });
});
