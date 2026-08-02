import { HouseholdActions } from '../household.actions';
import { ListSettingsActions } from './list-settings.actions';
import { initialState, listSettingsReducer } from './list-settings.reducer';
import {
  mockHouseholdState,
  mockListSettings,
} from '../../testing/household.test-data';

describe('listSettingsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = listSettingsReducer(initialState, {
      type: 'noop',
    } as never);
    expect(state).toBe(initialState);
  });

  it('replaces the whole settings object on updateSettings', () => {
    const next = mockListSettings({
      showQuickAdd: true,
      showQuickAddProduct: true,
    });
    const state = listSettingsReducer(
      initialState,
      ListSettingsActions.updateSettings(next)
    );
    expect(state).toBe(next);
  });

  it('uses the loaded settings when present', () => {
    const loaded = mockListSettings({ showProductsInStorage: true });
    const state = listSettingsReducer(
      initialState,
      HouseholdActions.loaded(mockHouseholdState({ listSettings: loaded }))
    );
    expect(state).toBe(loaded);
  });

  it('falls back to the current state when the loaded document is absent', () => {
    const state = listSettingsReducer(
      initialState,
      HouseholdActions.loaded(null)
    );
    expect(state).toBe(initialState);
  });
});
