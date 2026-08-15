import {
  mockPlayer,
  mockPlayersState,
} from '../../testing/trackplay.test-data';
import { mockTrackplayState } from '../../testing/trackplay.test-data';
import { initialPlayersState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { PlayersActions } from './players.actions';
import { playersReducer } from './players.reducer';

describe('playersReducer', () => {
  it('prepends a created player', () => {
    const state = playersReducer(
      initialPlayersState,
      PlayersActions.addItem(mockPlayer({ id: 'p1', name: 'Alice' }))
    );

    expect(state.items.map((player) => player.id)).toEqual(['p1']);
  });

  it('refuses a blank name', () => {
    const state = playersReducer(
      initialPlayersState,
      PlayersActions.addItem(mockPlayer({ id: 'p1', name: ' '.repeat(3) }))
    );

    expect(state.items).toHaveLength(0);
  });

  it('renames in place, keeping the id', () => {
    const start = mockPlayersState([mockPlayer({ id: 'p1', name: 'Alice' })]);

    const state = playersReducer(
      start,
      PlayersActions.updateItem({ id: 'p1', name: 'Alicia' })
    );

    expect(state.items[0]).toEqual(
      expect.objectContaining({ id: 'p1', name: 'Alicia' })
    );
  });

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

  it('drops the transient search and filter on hydration', () => {
    const persisted = mockTrackplayState({
      players: mockPlayersState([mockPlayer({ id: 'p1' })], {
        searchQuery: 'ali',
        filterBy: 'c1',
      }),
    });

    const state = playersReducer(
      initialPlayersState,
      TrackplayActions.loaded(persisted)
    );

    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });
});
