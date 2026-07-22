import { initialSettings, settingsReducer } from './settings.reducer';
import { SettingsActions } from './settings.actions';

describe('settingsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = settingsReducer(initialSettings, { type: 'noop' } as never);
    expect(state).toBe(initialSettings);
  });

  it('hydrates from loaded()', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.loaded({ version: '7', theme: 'boomer' })
    );
    expect(state).toEqual({ version: '7', theme: 'boomer' });
  });

  it('keeps the initial state when loaded() carries null (fresh install)', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.loaded(null)
    );
    expect(state).toBe(initialSettings);
  });

  it('defaults the theme to cyberpunk', () => {
    expect(initialSettings.theme).toBe('cyberpunk');
  });

  it('sets the theme via setTheme() while keeping other fields', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.setTheme('boomer')
    );
    expect(state).toEqual({ ...initialSettings, theme: 'boomer' });
  });
});
