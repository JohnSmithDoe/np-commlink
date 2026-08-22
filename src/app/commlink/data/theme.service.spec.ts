import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const setup = () => TestBed.inject(ThemeService);

describe('ThemeService', () => {
  afterEach(() => {
    delete document.documentElement.dataset['skin'];
    delete document.documentElement.dataset['mode'];
    document.documentElement.style.cssText = '';
  });

  it('sets the <html> axis pair as two independent attributes', () => {
    const theme = setup();
    theme.apply('boomer', 'dark');
    expect(document.documentElement.dataset['skin']).toBe('boomer');
    expect(document.documentElement.dataset['mode']).toBe('dark');
  });

  it('publishes each applied axis on its own signal', () => {
    const theme = setup();
    theme.apply('boomer', 'light');
    expect(theme.skin()).toBe('boomer');
    expect(theme.mode()).toBe('light');
  });

  it('takes the <meta name="theme-color"> content from the MODE, not the skin', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.append(meta);

    const theme = setup();
    theme.apply('boomer', 'dark');
    expect(meta.getAttribute('content')).toBe('#0f141b');
    theme.apply('cyberpunk', 'light');
    expect(meta.getAttribute('content')).toBe('#f4f6f8');

    meta.remove();
  });

  describe('accent overrides', () => {
    it('sets the full derived var set for an overridden accent', () => {
      const theme = setup();
      theme.apply('cyberpunk', 'dark', {
        primary: '#3880ff',
        secondary: '#32aea6',
      });

      const style = document.documentElement.style;
      expect(style.getPropertyValue('--ion-color-primary')).toBe('#3880ff');
      expect(style.getPropertyValue('--ion-color-primary-rgb')).toBe(
        '56, 128, 255'
      );
      expect(style.getPropertyValue('--ion-color-primary-contrast')).toBe(
        '#ffffff'
      );
      expect(style.getPropertyValue('--ion-color-primary-shade')).toBe(
        '#3171e0'
      );
      expect(style.getPropertyValue('--ion-color-primary-tint')).toBe(
        '#4c8dff'
      );
      expect(style.getPropertyValue('--ion-color-secondary')).toBe('#32aea6');
    });

    it('leaves an un-overridden accent with no inline var (falls back to SCSS)', () => {
      const theme = setup();
      theme.apply('cyberpunk', 'dark', {
        primary: '#3880ff',
        secondary: '#32aea6',
      });
      theme.apply('cyberpunk', 'dark', { primary: '#3880ff' } as never);

      expect(
        document.documentElement.style.getPropertyValue('--ion-color-secondary')
      ).toBe('');
    });

    it('clears every accent var when reapplied with no override at all', () => {
      const theme = setup();
      theme.apply('cyberpunk', 'dark', {
        primary: '#3880ff',
        secondary: '#32aea6',
      });
      theme.apply('cyberpunk', 'dark');

      const style = document.documentElement.style;
      expect(style.getPropertyValue('--ion-color-primary')).toBe('');
      expect(style.getPropertyValue('--ion-color-primary-rgb')).toBe('');
      expect(style.getPropertyValue('--ion-color-secondary')).toBe('');
    });
  });
});
