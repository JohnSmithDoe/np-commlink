import { extractEmoji, insertAt } from './emoji-text.utils';

describe('emoji text utils', () => {
  describe('extractEmoji', () => {
    it('finds nothing in a plain name', () => {
      expect(extractEmoji('Milch')).toEqual([]);
    });

    it('takes a ZWJ sequence whole', () => {
      expect(extractEmoji('👩‍🍳 kocht')).toEqual(['👩‍🍳']);
    });

    it('keeps a variation selector with its glyph', () => {
      expect(extractEmoji('☕️ Kaffee')).toEqual(['☕️']);
    });

    it('keeps a skin tone with its glyph', () => {
      expect(extractEmoji('👍🏽 gut')).toEqual(['👍🏽']);
    });

    it('dedupes and preserves first-seen order', () => {
      expect(extractEmoji('🥛 Milch 🍞 und 🥛 nochmal')).toEqual(['🥛', '🍞']);
    });
  });

  describe('insertAt', () => {
    it('splices at the caret', () => {
      expect(insertAt('Milch', '🥛', 0)).toBe('🥛Milch');
      expect(insertAt('Vollmilch', '🥛', 4)).toBe('Voll🥛milch');
    });

    it('appends when the caret is at the end', () => {
      expect(insertAt('Milch', '🥛', 5)).toBe('Milch🥛');
    });

    it('appends into an empty field', () => {
      expect(insertAt('', '🥛', 0)).toBe('🥛');
    });
  });
});
