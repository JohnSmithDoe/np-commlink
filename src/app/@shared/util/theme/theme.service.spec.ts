import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const setup = () => TestBed.inject(ThemeService);

describe('ThemeService', () => {
  afterEach(() => {
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.cssText = '';
  });

  it('sets the <html data-theme> attribute', () => {
    const theme = setup();
    theme.apply('boomer');
    expect(document.documentElement.dataset['theme']).toBe('boomer');
  });

  it('publishes the applied theme on the theme signal', () => {
    const theme = setup();
    theme.apply('boomer');
    expect(theme.theme()).toBe('boomer');
  });

  it('sets the <meta name="theme-color"> content', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.append(meta);

    const theme = setup();
    theme.apply('cyberpunk');
    expect(meta.getAttribute('content')).toBe('#0f141b');

    meta.remove();
  });

  describe('accent overrides', () => {
    it('sets the full derived var set for an overridden accent', () => {
      const theme = setup();
      theme.apply('cyberpunk', { primary: '#3880ff', secondary: '#32aea6' });

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
      theme.apply('cyberpunk', { primary: '#3880ff', secondary: '#32aea6' });
      theme.apply('cyberpunk', { primary: '#3880ff' } as never);

      expect(
        document.documentElement.style.getPropertyValue('--ion-color-secondary')
      ).toBe('');
    });

    it('clears every accent var when reapplied with no override at all', () => {
      const theme = setup();
      theme.apply('cyberpunk', { primary: '#3880ff', secondary: '#32aea6' });
      theme.apply('cyberpunk');

      const style = document.documentElement.style;
      expect(style.getPropertyValue('--ion-color-primary')).toBe('');
      expect(style.getPropertyValue('--ion-color-primary-rgb')).toBe('');
      expect(style.getPropertyValue('--ion-color-secondary')).toBe('');
    });
  });
});
