import { ListSettingsActions } from './list-settings.actions';
import {
  initialListSettings,
  listSettingsReducer,
} from './list-settings.reducer';
import { mockListSettings } from '../../testing/grocery.test-data';

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
      ListSettingsActions.loaded(loaded)
    );
    expect(state).toBe(loaded);
  });

  it('falls back to the current state when the loaded settings are absent', () => {
    const state = listSettingsReducer(
      initialListSettings,
      ListSettingsActions.loaded(null)
    );
    expect(state).toBe(initialListSettings);
  });
});
