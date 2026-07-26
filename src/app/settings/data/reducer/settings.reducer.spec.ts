import { initialSettings, settingsReducer } from './settings.reducer';
import { SettingsActions } from '../actions/settings.actions';

describe('settingsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = settingsReducer(initialSettings, { type: 'noop' } as never);
    expect(state).toBe(initialSettings);
  });

  it('hydrates from loaded()', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.loaded({ theme: 'boomer' })
    );
    expect(state).toEqual({ theme: 'boomer' });
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

  describe('setAccentColors', () => {
    it('stores a custom accent pair under the given theme', () => {
      const state = settingsReducer(
        initialSettings,
        SettingsActions.setAccentColors('cyberpunk', {
          primary: '#111111',
          secondary: '#222222',
        })
      );
      expect(state.customAccents).toEqual({
        cyberpunk: { primary: '#111111', secondary: '#222222' },
      });
    });

    it("keeps the other theme's override untouched", () => {
      const seeded = settingsReducer(
        initialSettings,
        SettingsActions.setAccentColors('cyberpunk', {
          primary: '#111111',
          secondary: '#222222',
        })
      );
      const state = settingsReducer(
        seeded,
        SettingsActions.setAccentColors('boomer', {
          primary: '#333333',
          secondary: '#444444',
        })
      );
      expect(state.customAccents).toEqual({
        cyberpunk: { primary: '#111111', secondary: '#222222' },
        boomer: { primary: '#333333', secondary: '#444444' },
      });
    });
  });

  describe('resetAccentColors', () => {
    it("deletes only the given theme's override", () => {
      const seeded = settingsReducer(
        initialSettings,
        SettingsActions.setAccentColors('cyberpunk', {
          primary: '#111111',
          secondary: '#222222',
        })
      );
      const withBoth = settingsReducer(
        seeded,
        SettingsActions.setAccentColors('boomer', {
          primary: '#333333',
          secondary: '#444444',
        })
      );
      const state = settingsReducer(
        withBoth,
        SettingsActions.resetAccentColors('cyberpunk')
      );
      expect(state.customAccents).toEqual({
        boomer: { primary: '#333333', secondary: '#444444' },
      });
    });

    it('is a no-op when nothing was set', () => {
      const state = settingsReducer(
        initialSettings,
        SettingsActions.resetAccentColors('cyberpunk')
      );
      expect(state.customAccents).toEqual({});
    });
  });
});
