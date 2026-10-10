import {
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { initialPlayersState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { PlayersActions } from './players.actions';
import { playersReducer } from './players.reducer';

describe('playersReducer', () => {
  it('toggles the sort direction on a repeated sort tap', () => {
    const first = playersReducer(
      initialPlayersState,
      PlayersActions.updateSort('name', 'toggle')
    );
    const second = playersReducer(
      first,
      PlayersActions.updateSort('name', 'toggle')
    );

    expect(first.sort).toEqual({ sortBy: 'name', sortDirection: 'desc' });
    expect(second.sort).toEqual({ sortBy: 'name', sortDirection: 'asc' });
  });

  it('keeps the sort but drops the transient search and filter on hydration', () => {
    const persisted = mockTrackplayState({
      players: mockPlayersState({
        searchQuery: 'ali',
        filterBy: 'c1',
        sort: { sortBy: 'lastPlayedAt', sortDirection: 'desc' },
      }),
    });

    const state = playersReducer(
      initialPlayersState,
      TrackplayActions.loaded(persisted)
    );

    expect(state.sort).toEqual({
      sortBy: 'lastPlayedAt',
      sortDirection: 'desc',
    });
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });
});
