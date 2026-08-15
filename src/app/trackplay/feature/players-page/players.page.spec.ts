import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { PlayersActions } from '../../data';
import { TrackplayPlayersPage } from './players.page';

describe('TrackplayPlayersPage', () => {
  let component: TrackplayPlayersPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayersPage],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayPlayersPage).componentInstance;
  };

  it('dispatches removeItem with the player', () => {
    const player = mockPlayer({ id: 'p1' });
    setup();

    component.deletePlayer(player);

    expect(dispatch).toHaveBeenCalledWith(PlayersActions.removeItem(player));
  });

  it('returns per-player stats, falling back to empty stats', () => {
    const ended = mockGame({
      id: 'g1',
      playerIds: ['p1', 'p2'],
      rounds: [],
      ended: true,
    });
    setup(
      mockTrackplayState({
        players: mockPlayersState([
          mockPlayer({ id: 'p1' }),
          mockPlayer({ id: 'p2' }),
        ]),
        games: mockGamesState([ended]),
      })
    );

    expect(component.statsFor(mockPlayer({ id: 'p1' })).play).toBe(1);
    expect(component.statsFor(mockPlayer({ id: 'nope' }))).toEqual({
      play: 0,
      win: 0,
      loss: 0,
      open: 0,
    });
  });
});
