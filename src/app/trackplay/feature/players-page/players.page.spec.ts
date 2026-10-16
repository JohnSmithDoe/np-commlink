import { TestBed } from '@angular/core/testing';
import {
  providePersonEditor,
  provideTestingProviders,
} from '../../../@shared/testing/test-providers';
import { PersonEditor } from '../../../@shared/util/people/person-editor.token';
import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
  providePeople,
} from '../../testing/trackplay.test-data';
import { PlayersPageFacade } from '../../data';
import { TrackplayPlayersPage } from './players.page';

describe('TrackplayPlayersPage', () => {
  let component: TrackplayPlayersPage;
  let editor: PersonEditor;

  const setup = (state = mockTrackplayState()) => {
    editor = { create: vi.fn() };
    TestBed.configureTestingModule({
      imports: [TrackplayPlayersPage],
      providers: [
        provideTestingProviders({ trackplay: state }),
        providePeople([mockPlayer({ id: 'p1' }), mockPlayer({ id: 'p2' })]),
        providePersonEditor(editor),
      ],
    });
    component = TestBed.createComponent(TrackplayPlayersPage).componentInstance;
  };

  it('creates a person from the search term on Enter, without leaving', () => {
    setup(
      mockTrackplayState({
        players: mockPlayersState({ searchQuery: 'Dunkelzahn' }),
      })
    );

    TestBed.inject(PlayersPageFacade).addItemFromSearch();

    expect(editor.create).toHaveBeenCalledWith('Dunkelzahn');
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
