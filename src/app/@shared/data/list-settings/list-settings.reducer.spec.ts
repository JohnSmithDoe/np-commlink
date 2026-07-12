import { IDatastore } from '../../types';
import { ApplicationActions } from '../application.actions';
import { ListSettingsActions } from './list-settings.actions';
import {
  initialListSettings,
  listSettingsReducer,
} from './list-settings.reducer';
import { mockListSettings } from '../../testing/test-data';

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
      showQuickAddGlobal: true,
    });
    const state = listSettingsReducer(
      initialListSettings,
      ListSettingsActions.updateSettings(next)
    );
    expect(state).toBe(next);
  });

  it('uses the loaded datastore settings when present', () => {
    const loaded = mockListSettings({ showGlobalsInStorage: true });
    const datastore = { listSettings: loaded } as IDatastore;
    const state = listSettingsReducer(
      initialListSettings,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state).toBe(loaded);
  });

  it('falls back to the current state when the datastore has no settings', () => {
    const datastore = {} as IDatastore;
    const state = listSettingsReducer(
      initialListSettings,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state).toBe(initialListSettings);
  });
});
