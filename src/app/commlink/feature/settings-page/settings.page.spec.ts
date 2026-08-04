import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import type { SegmentCustomEvent } from '@ionic/core';
import { AccentColors, Theme } from '../../../@shared/model/app.types';
import { SettingsFacade } from '../../data';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  const theme = signal<Theme>('cyberpunk');
  const customAccents = signal<Partial<Record<Theme, AccentColors>>>({});
  const settings = {
    theme,
    customAccents,
    setTheme: vi.fn(),
    setAccentColors: vi.fn(),
    resetAccentColors: vi.fn(),
  };

  const setup = () => {
    theme.set('cyberpunk');
    customAccents.set({});
    settings.setTheme.mockClear();
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

  describe('the theme picker', () => {
    it('offers every member of the theme union, each with a label key', () => {
      const page = setup();
      expect(page.themes).toEqual(['cyberpunk', 'boomer']);
      for (const option of page.themes) {
        expect(page.themeLabelKeys[option]).toBe(`settings.theme.${option}`);
      }
    });

    it('sets the theme the segment reports', () => {
      const page = setup();
      page.changeTheme({ detail: { value: 'boomer' } } as SegmentCustomEvent);
      expect(settings.setTheme).toHaveBeenCalledWith('boomer');
    });
  });

  describe('swatches', () => {
    it("falls back to the active theme's built-in swatch when unset", () => {
      const page = setup();
      expect(page.primarySwatch()).toBe('#de8b27');
      expect(page.secondarySwatch()).toBe('#32aea6');
    });

    it("reads the OTHER theme's built-in swatch once switched", () => {
      const page = setup();
      theme.set('boomer');
      expect(page.primarySwatch()).toBe('#2f5bd0');
      expect(page.secondarySwatch()).toBe('#4b6b7a');
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
    it('dispatches a reset for the currently-selected theme', () => {
      const page = setup();
      theme.set('boomer');
      page.resetAccents();
      expect(settings.resetAccentColors).toHaveBeenCalledWith('boomer');
    });
  });
});
