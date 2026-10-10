import { mockGame, mockPlayer } from '../testing/trackplay.test-data';
import { playersFrom } from './players.utils';

const EARLIER = '2024-06-01T10:00:00.000Z';
const LATER = '2024-06-02T10:00:00.000Z';

describe('playersFrom', () => {
  it('seats persons only, never a pet', () => {
    const people = [
      mockPlayer({ id: 'p1' }),
      mockPlayer({ id: 'cat', kind: 'pet' }),
    ];

    expect(playersFrom(people, []).map(({ id }) => id)).toEqual(['p1']);
  });

  it('stamps each player with the latest game they sat in', () => {
    const games = [
      mockGame({ id: 'g1', playerIds: ['p1', 'p2'], updatedAt: LATER }),
      mockGame({ id: 'g2', playerIds: ['p1'], updatedAt: EARLIER }),
    ];
    const people = [
      mockPlayer({ id: 'p1' }),
      mockPlayer({ id: 'p2' }),
      mockPlayer({ id: 'p3' }),
    ];

    expect(
      playersFrom(people, games).map(({ id, lastPlayedAt }) => [
        id,
        lastPlayedAt,
      ])
    ).toEqual([
      ['p1', LATER],
      ['p2', LATER],
      ['p3', undefined],
    ]);
  });
});
