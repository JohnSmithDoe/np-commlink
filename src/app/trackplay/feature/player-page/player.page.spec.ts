import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { mockRouterState } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GamesActions } from '../../data';
import { TrackplayPlayerPage } from './player.page';

describe('TrackplayPlayerPage', () => {
  let component: TrackplayPlayerPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (id = 'p1') => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerPage],
      providers: [
        provideTestingProviders({
          trackplay: mockTrackplayState({
            players: mockPlayersState([mockPlayer({ id: 'p1', name: 'Ada' })]),
            games: mockGamesState([
              mockGame({ id: 'g1', playerIds: ['p1'] }),
              mockGame({ id: 'g2', playerIds: ['p2'] }),
            ]),
          }),
          router: mockRouterState({ parameters: { id } }),
        }),
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayPlayerPage).componentInstance;
  };

  it('heads the page with the route player, not a route snapshot', () => {
    setup();

    expect(component.facade.heading()).toBe('Ada');
  });

  it('lists only the games the route player joined', () => {
    setup();

    expect(component.facade.items().map((game) => game.id)).toEqual(['g1']);
  });

  it('dispatches removeItem with the game', () => {
    const game = mockGame({ id: 'g1' });
    setup();

    component.deleteGame(game);

    expect(dispatch).toHaveBeenCalledWith(GamesActions.removeItem(game));
  });
});
