import {
  mockGameType,
  mockGameTypesState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { initialGameTypesState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { GameTypesActions } from './game-types.actions';
import { gameTypesReducer } from './game-types.reducer';

describe('gameTypesReducer', () => {
  it('seeds the three defaults', () => {
    expect(initialGameTypesState.items.map((type) => type.id)).toEqual([
      'default',
      'rommee',
      'skat',
    ]);
  });

  it('adds a custom type alongside the defaults', () => {
    const state = gameTypesReducer(
      initialGameTypesState,
      GameTypesActions.addItem(mockGameType({ id: 'canasta', name: 'Canasta' }))
    );

    expect(state.items.map((type) => type.id)).toContain('canasta');
    expect(state.items).toHaveLength(4);
  });

  it('re-seeds the defaults when a loaded document carries no catalog', () => {
    const persisted = mockTrackplayState({
      gameTypes: mockGameTypesState([]),
    });

    const state = gameTypesReducer(
      initialGameTypesState,
      TrackplayActions.loaded(persisted)
    );

    expect(state.items.map((type) => type.id)).toEqual([
      'default',
      'rommee',
      'skat',
    ]);
  });

  it('keeps a loaded catalog that has entries', () => {
    const persisted = mockTrackplayState({
      gameTypes: mockGameTypesState([mockGameType({ id: 'only' })]),
    });

    const state = gameTypesReducer(
      initialGameTypesState,
      TrackplayActions.loaded(persisted)
    );

    expect(state.items.map((type) => type.id)).toEqual(['only']);
  });
});
