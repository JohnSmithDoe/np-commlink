import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockPlayer,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
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

  it('dispatches deletePlayer with the player', () => {
    const player = mockPlayer({ id: 'p1' });
    setup();

    component.deletePlayer(player);

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.deletePlayer(player)
    );
  });

  it('counts shown vs. total players', () => {
    setup(
      mockTrackplayState({
        players: {
          p1: mockPlayer({ id: 'p1', name: 'Alice' }),
          p2: mockPlayer({ id: 'p2', name: 'Bob' }),
        },
      })
    );

    expect(component.shown()).toBe(2);
    expect(component.total()).toBe(2);
  });

  it('returns per-player stats, falling back to empty stats', () => {
    const ended = mockGame({
      id: 'g1',
      players: ['p1', 'p2'],
      rounds: [],
      ended: true,
    });
    setup(
      mockTrackplayState({
        players: { p1: mockPlayer({ id: 'p1' }), p2: mockPlayer({ id: 'p2' }) },
        games: { g1: ended },
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
