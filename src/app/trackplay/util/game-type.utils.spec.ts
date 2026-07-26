import { mockGame, mockGameType } from '../testing/trackplay.test-data';
import { gameTypeName } from './game-type.utils';

describe('gameTypeName', () => {
  it('resolves the type name from the catalog', () => {
    const type = mockGameType({ id: 't1', name: 'Standard' });
    const game = mockGame({ type: 't1' });
    expect(gameTypeName(game, { t1: type }, 'Unknown')).toBe('Standard');
  });

  it('falls back when the type is not in the catalog', () => {
    const game = mockGame({ type: 'nope' });
    expect(gameTypeName(game, {}, 'Unknown')).toBe('Unknown');
  });
});
