import { EmojiActions } from '../../@shared/data/emoji/emoji.actions';
import { SettingsState } from '../model/settings.types';
import { initialSettings, settingsReducer } from './settings.reducer';
import { SettingsActions } from './settings.actions';

const remember = (state: SettingsState, ...glyphs: string[]) =>
  settingsReducer(state, EmojiActions.used(glyphs));

describe('settingsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = settingsReducer(initialSettings, { type: 'noop' } as never);
    expect(state).toBe(initialSettings);
  });

  it('hydrates from loaded()', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.loaded({ theme: 'boomer', language: 'de' })
    );
    expect(state).toEqual({ theme: 'boomer', language: 'de' });
  });

  it('fills a persisted doc that is missing the theme from the defaults', () => {
    const state = settingsReducer(
      initialSettings,
      SettingsActions.loaded({} as never)
    );
    expect(state.theme).toBe('cyberpunk');
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

  describe('recentEmojis', () => {
    it('starts empty and puts the newest first', () => {
      const state = remember(remember(initialSettings, '🥛'), '🍞');

      expect(state.recentEmojis).toEqual(['🍞', '🥛']);
    });

    it('keeps the order one save spelled, not one glyph at a time', () => {
      const state = remember(initialSettings, '🥛', '🍞');

      expect(state.recentEmojis).toEqual(['🥛', '🍞']);
    });

    it('moves a glyph used again to the front instead of duplicating it', () => {
      const state = remember(remember(initialSettings, '🥛', '🍞'), '🥛');

      expect(state.recentEmojis).toEqual(['🥛', '🍞']);
    });

    it('caps the list so the settings doc cannot become a usage log', () => {
      const many = Array.from({ length: 40 }, (_, index) => `e${index}`);
      const state = remember(initialSettings, ...many);

      expect(state.recentEmojis).toHaveLength(24);
      expect(state.recentEmojis?.[0]).toBe('e0');
    });

    it('hydrates a stored doc that predates the field', () => {
      const stored = { theme: 'boomer', language: 'en' } as SettingsState;
      const hydrated = settingsReducer(
        initialSettings,
        SettingsActions.loaded(stored)
      );

      expect(hydrated.recentEmojis).toBeUndefined();
      expect(remember(hydrated, '🥛').recentEmojis).toEqual(['🥛']);
    });
  });
});
