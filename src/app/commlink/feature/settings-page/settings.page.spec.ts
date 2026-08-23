import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { AccentColors, Mode, Skin } from '../../../@shared/model/app.types';
import { SettingsFacade } from '../../data';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  const skin = signal<Skin>('cyberpunk');
  const mode = signal<Mode>('dark');
  const customAccents = signal<Partial<Record<Skin, AccentColors>>>({});
  const settings = {
    skin,
    mode,
    customAccents,
    setSkin: vi.fn(),
    setMode: vi.fn(),
    setAccentColors: vi.fn(),
    resetAccentColors: vi.fn(),
  };

  const setup = () => {
    skin.set('cyberpunk');
    mode.set('dark');
    customAccents.set({});
    settings.setSkin.mockClear();
    settings.setMode.mockClear();
    settings.setAccentColors.mockClear();
    settings.resetAccentColors.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SettingsFacade, useValue: settings },
      ],
    });
    return TestBed.createComponent(SettingsPage).componentInstance;
  };

  describe('the skin picker', () => {
    it('offers every member of the skin union, each with a label key', () => {
      const page = setup();
      expect(page.skins).toEqual(['cyberpunk', 'boomer']);
      for (const option of page.skins) {
        expect(page.skinLabelKeys[option]).toBe(`settings.theme.${option}`);
      }
    });

    it('sets the skin the segment reports', () => {
      const page = setup();
      page.changeSkin('boomer');
      expect(settings.setSkin).toHaveBeenCalledWith('boomer');
    });
  });

  describe('the mode picker', () => {
    it('offers every member of the mode union, each with a label key', () => {
      const page = setup();
      expect(page.modes).toEqual(['light', 'dark']);
      for (const option of page.modes) {
        expect(page.modeLabelKeys[option]).toBe(`settings.mode.${option}`);
      }
    });

    it('sets the mode the segment reports, leaving the skin alone', () => {
      const page = setup();
      page.changeMode('light');
      expect(settings.setMode).toHaveBeenCalledWith('light');
      expect(settings.setSkin).not.toHaveBeenCalled();
    });
  });

  describe('swatches', () => {
    it("falls back to the active theme's built-in swatch when unset", () => {
      const page = setup();
      expect(page.primarySwatch()).toBe('#de8b27');
      expect(page.secondarySwatch()).toBe('#32aea6');
    });

    it("reads the OTHER skin's built-in swatch once switched", () => {
      const page = setup();
      skin.set('boomer');
      mode.set('light');
      expect(page.primarySwatch()).toBe('#2f5bd0');
      expect(page.secondarySwatch()).toBe('#4b6b7a');
    });

    it('re-reads the swatch when only the MODE changes', () => {
      const page = setup();
      skin.set('boomer');
      mode.set('light');
      expect(page.primarySwatch()).toBe('#2f5bd0');
      mode.set('dark');
      expect(page.primarySwatch()).toBe('#7aa2f7');
    });

    it('prefers a stored override over the built-in swatch', () => {
      const page = setup();
      customAccents.set({
        cyberpunk: { primary: '#111111', secondary: '#222222' },
      });
      expect(page.primarySwatch()).toBe('#111111');
      expect(page.secondarySwatch()).toBe('#222222');
    });
  });

  describe('changePrimaryAccent / changeSecondaryAccent', () => {
    it('dispatches the edited color alongside the untouched sibling', () => {
      const page = setup();
      page.changePrimaryAccent('#abcdef');
      expect(settings.setAccentColors).toHaveBeenCalledWith('cyberpunk', {
        primary: '#abcdef',
        secondary: '#32aea6',
      });
    });

    it('leaves the primary untouched when editing the secondary', () => {
      const page = setup();
      page.changeSecondaryAccent('#fedcba');
      expect(settings.setAccentColors).toHaveBeenCalledWith('cyberpunk', {
        primary: '#de8b27',
        secondary: '#fedcba',
      });
    });
  });

  describe('resetAccents', () => {
    it('dispatches a reset for the currently-selected skin', () => {
      const page = setup();
      skin.set('boomer');
      page.resetAccents();
      expect(settings.resetAccentColors).toHaveBeenCalledWith('boomer');
    });
  });
});
