import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, take, toArray } from 'rxjs';
import { EmojiRecentsService } from '../../@shared/util/emoji/emoji-recents.service';
import { DatabaseService } from '../../@shared/util/persistence/database.service';
import { AppReloadService } from '../../@shared/util/service-worker/app-reload.service';
import { LanguageService } from '../../@shared/util/theme/language.service';
import { SplashService } from '../../@shared/util/services/splash.service';
import { ThemeService } from '../../@shared/util/theme/theme.service';
import { mockSettingsState } from '../testing/settings.test-data';
import { SettingsActions } from './settings.actions';
import { SettingsEffects } from './settings.effects';

describe('SettingsEffects', () => {
  let actions$: Observable<Action>;
  let theme: { apply: ReturnType<typeof vi.fn> };
  let splash: { reveal: ReturnType<typeof vi.fn> };
  let database: {
    save: ReturnType<typeof vi.fn>;
    settled: ReturnType<typeof vi.fn>;
  };
  let language: { apply: ReturnType<typeof vi.fn> };
  let reload: { reload: ReturnType<typeof vi.fn> };
  let store: MockStore;

  const setup = (settings = mockSettingsState()) => {
    theme = { apply: vi.fn() };
    splash = { reveal: vi.fn() };
    database = {
      save: vi.fn().mockResolvedValue(undefined),
      settled: vi.fn().mockResolvedValue(undefined),
    };
    language = { apply: vi.fn() };
    reload = { reload: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        SettingsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { settings } }),
        { provide: ThemeService, useValue: theme },
        { provide: SplashService, useValue: splash },
        { provide: DatabaseService, useValue: database },
        { provide: LanguageService, useValue: language },
        { provide: AppReloadService, useValue: reload },
      ],
    });
    store = TestBed.inject(MockStore);
    return TestBed.inject(SettingsEffects);
  };

  afterEach(() => store?.resetSelectors());

  describe('applyTheme$', () => {
    it('mirrors the hydrated theme onto the DOM', async () => {
      const effects = setup({ theme: 'boomer', language: 'de' });
      actions$ = of(
        SettingsActions.loaded({ theme: 'boomer', language: 'de' })
      );

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('boomer', undefined);
    });

    it('mirrors a picked theme', async () => {
      const effects = setup({ theme: 'boomer', language: 'de' });
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('boomer', undefined);
    });

    it("passes the active theme's custom accents", async () => {
      const colors = { primary: '#111111', secondary: '#222222' };
      const effects = setup({
        theme: 'cyberpunk',
        language: 'de',
        customAccents: { cyberpunk: colors },
      });
      actions$ = of(SettingsActions.setAccentColors('cyberpunk', colors));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', colors);
    });

    it("does not pass the OTHER theme's accents", async () => {
      const effects = setup({
        theme: 'cyberpunk',
        language: 'de',
        customAccents: {
          boomer: { primary: '#333333', secondary: '#444444' },
        },
      });
      actions$ = of(SettingsActions.loaded(null));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', undefined);
    });

    it('mirrors a reset back to the built-in swatch', async () => {
      const effects = setup({
        theme: 'cyberpunk',
        language: 'de',
        customAccents: {},
      });
      actions$ = of(SettingsActions.resetAccentColors('cyberpunk'));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', undefined);
    });
  });

  describe('the boot splash', () => {
    it('lifts on hydration', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.loaded(null));

      await firstValueFrom(effects.applyTheme$);

      expect(splash.reveal).toHaveBeenCalledTimes(1);
    });

    it('does not lift on a theme change — the splash is a boot affordance', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.applyTheme$.pipe(toArray()));

      expect(splash.reveal).not.toHaveBeenCalled();
    });

    it('applies the theme before lifting', async () => {
      const order: string[] = [];
      const effects = setup();
      theme.apply.mockImplementation(() => void order.push('apply'));
      splash.reveal.mockImplementation(() => void order.push('reveal'));
      actions$ = of(
        SettingsActions.loaded({ theme: 'boomer', language: 'de' })
      );

      await firstValueFrom(effects.applyTheme$);

      expect(order).toEqual(['apply', 'reveal']);
    });
  });

  it('writes nothing on a null load — the descriptor owns the only save path', async () => {
    const effects = setup();
    actions$ = of(SettingsActions.loaded(null));

    await firstValueFrom(effects.applyTheme$.pipe(toArray()));

    expect(database.save).not.toHaveBeenCalled();
  });

  describe('applyLanguage$', () => {
    it('hands the hydrated language to the language service', async () => {
      const effects = setup({ theme: 'boomer', language: 'en' });
      actions$ = of(
        SettingsActions.loaded({ theme: 'boomer', language: 'en' })
      );

      await firstValueFrom(effects.applyLanguage$);

      expect(language.apply).toHaveBeenCalledWith('en');
    });

    it('applies a picked language', async () => {
      const effects = setup({ theme: 'cyberpunk', language: 'en' });
      actions$ = of(SettingsActions.setLanguage('en'));

      await firstValueFrom(effects.applyLanguage$);

      expect(language.apply).toHaveBeenCalledWith('en');
    });
  });

  describe('restartOnLanguageChange$', () => {
    it('waits for the pending write before restarting', async () => {
      const order: string[] = [];
      const effects = setup({ theme: 'cyberpunk', language: 'en' });
      database.settled.mockImplementation(
        async () => void order.push('settled')
      );
      reload.reload.mockImplementation(() => void order.push('reload'));
      actions$ = of(SettingsActions.setLanguage('en'));

      await firstValueFrom(effects.restartOnLanguageChange$);

      expect(order).toEqual(['settled', 'reload']);
    });

    it('does not restart for any other settings change', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.restartOnLanguageChange$.pipe(toArray()));

      expect(reload.reload).not.toHaveBeenCalled();
    });
  });

  describe('publishRecentEmojis$', () => {
    it('republishes the persisted list', async () => {
      const effects = setup(mockSettingsState({ recentEmojis: ['🥛', '🍞'] }));
      const recents = TestBed.inject(EmojiRecentsService);

      await firstValueFrom(effects.publishRecentEmojis$);

      expect(recents.recent()).toEqual(['🥛', '🍞']);
    });

    it('follows the slice when another emoji is remembered', async () => {
      const effects = setup(mockSettingsState({ recentEmojis: ['🥛'] }));
      const recents = TestBed.inject(EmojiRecentsService);
      const settled = firstValueFrom(
        effects.publishRecentEmojis$.pipe(take(2), toArray())
      );

      store.setState({
        settings: mockSettingsState({ recentEmojis: ['🍞', '🥛'] }),
      });
      await settled;

      expect(recents.recent()).toEqual(['🍞', '🥛']);
    });
  });
});
