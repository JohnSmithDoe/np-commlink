import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockTrackplayState,
  providePeople,
} from '../../testing/trackplay.test-data';
import { PlayersPageFacade } from '../../data';
import { TrackplayPlayersPage } from './players.page';

describe('TrackplayPlayersPage', () => {
  let component: TrackplayPlayersPage;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayersPage],
      providers: [
        provideTestingProviders({ trackplay: state }),
        providePeople([mockPlayer({ id: 'p1' }), mockPlayer({ id: 'p2' })]),
      ],
    });
    component = TestBed.createComponent(TrackplayPlayersPage).componentInstance;
  };

  it('sends the add button to the people program', () => {
    setup();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    TestBed.inject(PlayersPageFacade).addItemFromSearch();

    expect(navigate).toHaveBeenCalledWith(['/people']);
  });

  it('returns per-player stats, falling back to empty stats', () => {
    const ended = mockGame({
      id: 'g1',
      playerIds: ['p1', 'p2'],
      rounds: [],
      ended: true,
    });
    setup(mockTrackplayState({ games: mockGamesState([ended]) }));

    expect(component.statsFor(mockPlayer({ id: 'p1' })).play).toBe(1);
    expect(component.statsFor(mockPlayer({ id: 'nope' }))).toEqual({
      play: 0,
      win: 0,
      loss: 0,
      open: 0,
    });
  });
});
