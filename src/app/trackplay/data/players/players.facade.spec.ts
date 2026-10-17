import { TestBed } from '@angular/core/testing';
import { mockRouterState } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
  providePeople,
} from '../../testing/trackplay.test-data';
import { PlayersFacade } from './players.facade';

const EARLIER = '2024-06-01T10:00:00.000Z';
const LATER = '2024-06-02T10:00:00.000Z';

const people = [
  mockPlayer({ id: 'b', name: 'Bravo' }),
  mockPlayer({ id: 'a', name: 'Alpha' }),
  mockPlayer({ id: 'never', name: 'Never' }),
];
const games = mockGamesState([
  mockGame({ id: 'g1', playerIds: ['a'], updatedAt: EARLIER }),
  mockGame({ id: 'g2', playerIds: ['b', 'gone'], updatedAt: LATER }),
]);

const setup = (
  players = mockPlayersState(),
  routePlayerId?: string
): PlayersFacade => {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({
        trackplay: mockTrackplayState({ players, games }),
        router: mockRouterState({
          parameters: routePlayerId ? { id: routePlayerId } : {},
        }),
      }),
      providePeople(people),
    ],
  });
  return TestBed.inject(PlayersFacade);
};

const idsOf = (facade: PlayersFacade): string[] =>
  facade.items().map(({ id }) => id);

describe('PlayersFacade', () => {
  it('lists the people, sorted by the local view', () => {
    expect(idsOf(setup())).toEqual(['a', 'b', 'never']);
  });

  it('sorts by last played, a player who never played last', () => {
    const facade = setup(
      mockPlayersState({
        sort: { sortBy: 'lastPlayedAt', sortDirection: 'desc' },
      })
    );

    expect(idsOf(facade)).toEqual(['b', 'a', 'never']);
  });

  it('narrows by the search term', () => {
    const facade = setup(mockPlayersState({ searchQuery: 'brav' }));
    expect(idsOf(facade)).toEqual(['b']);
  });

  it('resolves the route player, or nothing for an unknown id', () => {
    expect(setup(undefined, 'a').routePlayer()?.name).toBe('Alpha');
    TestBed.resetTestingModule();
    expect(setup(undefined, 'gone').routePlayer()).toBeUndefined();
  });

  it('names a seat whose person is gone with a placeholder', () => {
    const facade = setup();

    expect(facade.nameOf('a')).toBe('Alpha');
    expect(facade.nameOf('gone')).toBe('—');
  });
});
