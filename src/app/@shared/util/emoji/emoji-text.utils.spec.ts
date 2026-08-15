import { deleteRange, extractEmoji, replaceRange } from './emoji-text.utils';

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

  describe('replaceRange', () => {
    it('splices at a collapsed caret', () => {
      expect(replaceRange('Milch', '🥛', 0, 0)).toBe('🥛Milch');
      expect(replaceRange('Vollmilch', '🥛', 4, 4)).toBe('Voll🥛milch');
    });

    it('appends when the caret is at the end', () => {
      expect(replaceRange('Milch', '🥛', 5, 5)).toBe('Milch🥛');
    });

    it('appends into an empty field', () => {
      expect(replaceRange('', '🥛', 0, 0)).toBe('🥛');
    });

    it('replaces a selection rather than inserting beside it', () => {
      expect(replaceRange('Milch', '🥛', 0, 5)).toBe('🥛');
      expect(replaceRange('Vollmilch', '🥛', 0, 4)).toBe('🥛milch');
    });

    it('orders a reversed range and clamps one past the end', () => {
      expect(replaceRange('Milch', '🥛', 5, 0)).toBe('🥛');
      expect(replaceRange('Milch', '🥛', 3, 99)).toBe('Mil🥛');
    });
  });

  describe('deleteRange', () => {
    it('does nothing at the start of the text', () => {
      expect(deleteRange('Milch', 0, 0)).toEqual({ text: 'Milch', caret: 0 });
      expect(deleteRange('', 0, 0)).toEqual({ text: '', caret: 0 });
    });

    it('takes a single character of plain text', () => {
      expect(deleteRange('Milch', 5, 5)).toEqual({ text: 'Milc', caret: 4 });
    });

    it('takes a ZWJ family in one press', () => {
      const text = 'Milch👨‍👩‍👧';

      expect(deleteRange(text, text.length, text.length)).toEqual({
        text: 'Milch',
        caret: 5,
      });
    });

    it('takes a skin tone with its glyph', () => {
      expect(deleteRange('👍🏽', 4, 4)).toEqual({ text: '', caret: 0 });
    });

    it('takes a variation selector with its glyph', () => {
      expect(deleteRange('☕️', 2, 2)).toEqual({ text: '', caret: 0 });
    });

    it('takes a whole cluster when the caret sits inside it', () => {
      expect(deleteRange('👩‍🍳', 2, 2)).toEqual({ text: '', caret: 0 });
    });

    it('never splits a non-emoji surrogate pair', () => {
      expect(deleteRange('a𝐀', 3, 3)).toEqual({ text: 'a', caret: 1 });
    });

    it('keeps everything after the caret', () => {
      expect(deleteRange('🥛Milch', 2, 2)).toEqual({ text: 'Milch', caret: 0 });
    });

    it('clamps a caret past the end', () => {
      expect(deleteRange('Milch', 99, 99)).toEqual({ text: 'Milc', caret: 4 });
    });

    it('takes exactly the selection, not the character before it', () => {
      expect(deleteRange('Milch', 1, 4)).toEqual({ text: 'Mh', caret: 1 });
      expect(deleteRange('Milch', 0, 5)).toEqual({ text: '', caret: 0 });
    });

    it('leaves a selected cluster whole rather than widening to it', () => {
      expect(deleteRange('a👩‍🍳b', 1, 6)).toEqual({ text: 'ab', caret: 1 });
    });

    it('orders a reversed selection', () => {
      expect(deleteRange('Milch', 4, 1)).toEqual({ text: 'Mh', caret: 1 });
    });
  });
});
