import { deriveIonicColorSet } from './ionic-color.utils';

describe('deriveIonicColorSet', () => {
  it.each([
    [
      'boomer primary',
      '#2f5bd0',
      {
        rgb: '47, 91, 208',
        contrast: '#ffffff',
        shade: '#2950b7',
        tint: '#446bd5',
      },
    ],
    [
      'boomer secondary',
      '#4b6b7a',
      {
        rgb: '75, 107, 122',
        contrast: '#ffffff',
        shade: '#425e6b',
        tint: '#5d7a87',
      },
    ],
    [
      'cyberpunk primary',
      '#de8b27',
      {
        rgb: '222, 139, 39',
        contrast: '#000000',
        shade: '#c37a22',
        tint: '#e1973d',
      },
    ],
    [
      'cyberpunk secondary',
      '#32aea6',
      {
        rgb: '50, 174, 166',
        contrast: '#000000',
        shade: '#2c9992',
        tint: '#47b6af',
      },
    ],
    [
      "Ionic's default primary",
      '#3880ff',
      {
        rgb: '56, 128, 255',
        contrast: '#ffffff',
        shade: '#3171e0',
        tint: '#4c8dff',
      },
    ],
  ] as const)('derives %s (%s) exactly', (_name, hex, expected) => {
    const contrastRgb =
      expected.contrast === '#000000' ? '0, 0, 0' : '255, 255, 255';
    expect(deriveIonicColorSet(hex)).toEqual({
      base: hex,
      ...expected,
      contrastRgb,
    });
  });

  it('picks black contrast for a mid-luminance color close to the threshold', () => {
    const { contrast } = deriveIonicColorSet('#32aea6');
    expect(contrast).toBe('#000000');
  });

  it('rejects a non-hex input', () => {
    expect(() => deriveIonicColorSet('not-a-color')).toThrow();
  });
});
