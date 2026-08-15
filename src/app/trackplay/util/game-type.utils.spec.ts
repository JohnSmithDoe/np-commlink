import { mockGame } from '../testing/trackplay.test-data';
import { gameTypeIdOf, withGameTypeId } from './game-type.utils';

describe('gameTypeIdOf', () => {
  it('reads the single type off the inherited category array', () => {
    expect(gameTypeIdOf(mockGame({ categoryIds: ['skat'] }))).toBe('skat');
  });

  it('answers the default type where the array says nothing', () => {
    expect(gameTypeIdOf(mockGame({ categoryIds: [] }))).toBe('default');
    expect(gameTypeIdOf(mockGame({ categoryIds: undefined }))).toBe('default');
  });
});

describe('withGameTypeId', () => {
  it('replaces the type rather than appending a second one', () => {
    const retyped = withGameTypeId(
      mockGame({ categoryIds: ['skat'] }),
      'romme'
    );

    expect(retyped.categoryIds).toEqual(['romme']);
  });
});
