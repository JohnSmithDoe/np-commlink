import {
  emojiMatching,
  EMOJI_GROUP_IDS,
  EmojiGroup,
  toGroups,
} from './emoji.catalog';
import { EMOJI_DATA_DE } from './emoji.data.de';
import { EMOJI_DATA_EN } from './emoji.data.en';

describe('emoji catalog', () => {
  describe('toGroups', () => {
    it('joins label and tags into one lowercase haystack', () => {
      const [group] = toGroups({
        smileys: [
          { glyph: '🥛', label: 'Glas Milch', tags: 'getränk trinken' },
        ],
      });

      expect(group?.entries[0]).toEqual({
        glyph: '🥛',
        label: 'Glas Milch',
        tags: 'getränk trinken',
        keywords: 'glas milch getränk trinken',
      });
    });

    it('yields every group id, empty where the data has none', () => {
      const groups = toGroups({});

      expect(groups.map((group) => group.id)).toEqual([...EMOJI_GROUP_IDS]);
      expect(groups.every((group) => group.entries.length === 0)).toBe(true);
    });
  });

  describe.each([
    ['de', EMOJI_DATA_DE],
    ['en', EMOJI_DATA_EN],
  ])('generated %s bundle', (_language, data) => {
    const groups: EmojiGroup[] = toGroups(data);
    const entries = groups.flatMap((group) => group.entries);

    it('fills every declared group', () => {
      expect(groups.every((group) => group.entries.length > 0)).toBe(true);
    });

    it('carries a glyph and a label for every entry', () => {
      expect(entries.length).toBeGreaterThan(1000);
      expect(entries.every((entry) => entry.glyph && entry.label)).toBe(true);
    });

    it('drops tags the label makes redundant', () => {
      const redundant = entries.filter((entry) =>
        entry.tags
          .split(' ')
          .filter(Boolean)
          .some((tag) => entry.label.toLowerCase().includes(tag))
      );

      expect(redundant).toEqual([]);
    });
  });

  describe('emojiMatching', () => {
    const entries = toGroups(EMOJI_DATA_DE).flatMap((group) => group.entries);
    const glyphsFor = (query: string) =>
      entries.filter(emojiMatching(query)).map((entry) => entry.glyph);

    it('finds a German compound by its head', () => {
      expect(glyphsFor('hund')).toContain('🐶');
    });

    it('finds an emoji by a synonym the label does not contain', () => {
      expect(glyphsFor('kaffee')).toContain('☕️');
    });

    it('finds a non-food emoji by synonym', () => {
      expect(glyphsFor('urlaub').length).toBeGreaterThan(0);
    });

    it('ignores case and surrounding whitespace', () => {
      expect(glyphsFor('  MILCH ')).toContain('🥛');
    });
  });
});
