import { QuickAddActions } from './quick-add.actions';
import { initialQuickAdd, quickAddReducer } from './quick-add.reducer';
import { mockQuickAddState } from '../../testing/test-data';

describe('quickAddReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = quickAddReducer(initialQuickAdd, { type: 'noop' } as never);
    expect(state).toBe(initialQuickAdd);
  });

  it('replaces the state on updateState', () => {
    const next = mockQuickAddState({
      canAddLocal: true,
      canAddGlobal: true,
      searchQuery: 'milk',
    });
    const state = quickAddReducer(
      initialQuickAdd,
      QuickAddActions.updateState(next)
    );
    expect(state).toBe(next);
  });
});
