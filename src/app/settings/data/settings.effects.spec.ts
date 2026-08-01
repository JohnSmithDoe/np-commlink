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

    // The ordering is what the splash exists for: it covers the first paint so
    // nobody sees the wrong theme, which only holds if the theme is applied
    // before the reveal. Folding both into one tap is what makes that structural
    // rather than a matter of which effect was declared first.
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

  // `loaded(null)` means "absent key" *or* "read failed" — the load effect
  // cannot tell them apart. A seed effect used to answer it by writing
  // `initialSettings` straight to disk, so one transient read rejection lost
  // the user's theme permanently. Nothing read that seeded doc: `bootstrap()`
  // reads nothing, `runMigrations` reads each doc's own envelope, and settings
  // declares no ladder.
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
    // The reload is irreversible, so it must not overtake the descriptor's save
    // effect — reloading first would drop the choice the restart exists to apply.
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

    // Picking a theme is a live change; only the language needs a restart.
    it('does not restart for any other settings change', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.restartOnLanguageChange$.pipe(toArray()));

      expect(reload.reload).not.toHaveBeenCalled();
    });
  });

  // The emoji picker is @shared/ui and may reach neither this slice nor
  // type:data at all, so this mirror is its only route to the recents.
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
