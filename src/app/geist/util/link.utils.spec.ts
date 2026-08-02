import { linkForAvailability, openingLinkFor } from './link.utils';

describe('geist link utils', () => {
  describe('linkForAvailability', () => {
    it('reads an unavailable model as permanently unsupported', () => {
      expect(linkForAvailability('unavailable')).toBe('unsupported');
    });

    it('opens a session right away when the weights are already local', () => {
      expect(linkForAvailability('available')).toBe('reforging');
    });

    it.each(['downloadable', 'downloading'] as const)(
      'parks on the cold-start panel for a %s model',
      (availability) => {
        expect(linkForAvailability(availability)).toBe('dormant');
      }
    );
  });

  describe('openingLinkFor', () => {
    it('keeps the console up when the model is already downloaded', () => {
      expect(openingLinkFor('available')).toBe('reforging');
    });

    it.each(['downloadable', 'downloading', 'probing'] as const)(
      'shows the download meter while the model is %s',
      (availability) => {
        expect(openingLinkFor(availability)).toBe('priming');
      }
    );
  });
});
