import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { SplashService } from '../../../@shared/util/splash.service';
import { ThemeService } from '../../../@shared/util/theme.service';
import { SettingsActions } from '../actions/settings.actions';
import { initialSettings } from '../reducer/settings.reducer';
import { SettingsEffects } from './settings.effects';

describe('SettingsEffects', () => {
  let actions$: Observable<Action>;
  let theme: { apply: ReturnType<typeof vi.fn> };
  let splash: { reveal: ReturnType<typeof vi.fn> };
  let database: { save: ReturnType<typeof vi.fn> };
  let store: MockStore;

  const setup = (settings = initialSettings) => {
    theme = { apply: vi.fn() };
    splash = { reveal: vi.fn() };
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        SettingsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { settings } }),
        { provide: ThemeService, useValue: theme },
        { provide: SplashService, useValue: splash },
        { provide: DatabaseService, useValue: database },
      ],
    });
    store = TestBed.inject(MockStore);
    return TestBed.inject(SettingsEffects);
  };

  afterEach(() => store?.resetSelectors());

  describe('applyTheme$', () => {
    it('mirrors the hydrated theme onto the DOM', async () => {
      const effects = setup({ theme: 'boomer' });
      actions$ = of(SettingsActions.loaded({ theme: 'boomer' }));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('boomer', undefined);
    });

    it('mirrors a picked theme', async () => {
      const effects = setup({ theme: 'boomer' });
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('boomer', undefined);
    });

    it("passes the active theme's custom accents", async () => {
      const colors = { primary: '#111111', secondary: '#222222' };
      const effects = setup({
        theme: 'cyberpunk',
        customAccents: { cyberpunk: colors },
      });
      actions$ = of(SettingsActions.setAccentColors('cyberpunk', colors));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', colors);
    });

    it("does not pass the OTHER theme's accents", async () => {
      const effects = setup({
        theme: 'cyberpunk',
        customAccents: {
          boomer: { primary: '#333333', secondary: '#444444' },
        },
      });
      actions$ = of(SettingsActions.loaded(null));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', undefined);
    });

    it('mirrors a reset back to the built-in swatch', async () => {
      const effects = setup({ theme: 'cyberpunk', customAccents: {} });
      actions$ = of(SettingsActions.resetAccentColors('cyberpunk'));

      await firstValueFrom(effects.applyTheme$);

      expect(theme.apply).toHaveBeenCalledWith('cyberpunk', undefined);
    });
  });

  describe('revealSplash$', () => {
    it('lifts the boot splash on hydration', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.loaded(null));

      await firstValueFrom(effects.revealSplash$);

      expect(splash.reveal).toHaveBeenCalledTimes(1);
    });

    it('does not lift it on a theme change — the splash is a boot affordance', async () => {
      const effects = setup();
      actions$ = of(SettingsActions.setTheme('boomer'));

      await firstValueFrom(effects.revealSplash$.pipe(toArray()));

      expect(splash.reveal).not.toHaveBeenCalled();
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
    await firstValueFrom(effects.revealSplash$.pipe(toArray()));

    expect(database.save).not.toHaveBeenCalled();
  });
});
