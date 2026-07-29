import { linkForAvailability, openingLinkFor } from './link.utils';

describe('geist link utils', () => {
  describe('linkForAvailability', () => {
    // The APK case: the Android WebView will never expose the Prompt API, so the
    // page owes the user an explanation rather than a dead download button.
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
    // The flash this exists to stop: switching persona re-creates the session,
    // and the download panel has no business appearing for that.
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
