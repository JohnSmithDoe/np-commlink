import { GroceriesActions } from '../actions/groceries.actions';
import { ListSettingsActions } from '../actions/list-settings.actions';
import {
  initialListSettings,
  listSettingsReducer,
} from './list-settings.reducer';
import {
  mockGroceriesState,
  mockListSettings,
} from '../../testing/groceries.test-data';

describe('listSettingsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = listSettingsReducer(initialListSettings, {
      type: 'noop',
    } as never);
    expect(state).toBe(initialListSettings);
  });

  it('replaces the whole settings object on updateSettings', () => {
    const next = mockListSettings({
      showQuickAdd: true,
      showQuickAddProduct: true,
    });
    const state = listSettingsReducer(
      initialListSettings,
      ListSettingsActions.updateSettings(next)
    );
    expect(state).toBe(next);
  });

  it('uses the loaded settings when present', () => {
    const loaded = mockListSettings({ showProductsInStorage: true });
    const state = listSettingsReducer(
      initialListSettings,
      GroceriesActions.loaded(mockGroceriesState({ listSettings: loaded }))
    );
    expect(state).toBe(loaded);
  });

  it('falls back to the current state when the loaded document is absent', () => {
    const state = listSettingsReducer(
      initialListSettings,
      GroceriesActions.loaded(null)
    );
    expect(state).toBe(initialListSettings);
  });
});
