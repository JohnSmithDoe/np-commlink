import { HandbookEntry } from '../model/handbook.types';
import {
  groupHandbookEntries,
  handbookImageUrl,
  handbookNeighbours,
  handbookPageUrl,
  HANDBOOK_INDEX_URL,
  plainTextOf,
} from './handbook-content';

const entry = (
  slug: string,
  group: HandbookEntry['group'] = 'programme'
): HandbookEntry => ({
  slug,
  title: `DECK ${slug}`,
  plain: `Klartext ${slug}`,
  route: `/${slug}`,
  group,
  summary: `Kurz zu ${slug}`,
  tags: [slug],
  text: `Text zu ${slug}`,
});

describe('handbook content utils', () => {
  it('keeps every asset path relative, so both base hrefs resolve', () => {
    expect(HANDBOOK_INDEX_URL).toBe('./handbook/index.json');
    expect(handbookPageUrl('start')).toBe('./handbook/pages/start.json');
    expect(handbookImageUrl('deck.webp')).toBe('./handbook/img/deck.webp');
  });

  it('strips the markup a caption may carry', () => {
    expect(plainTextOf('Der <strong>Deck</strong>-Screen')).toBe(
      'Der Deck-Screen'
    );
  });

  it('groups in catalog order and drops the empty groups', () => {
    const grouped = groupHandbookEntries([
      entry('chrono'),
      entry('start', 'einstieg'),
    ]);

    expect(grouped.map((view) => view.group)).toEqual([
      'einstieg',
      'programme',
    ]);
  });

  it('walks the index order, with nothing past either edge', () => {
    const entries = [entry('a'), entry('b')];

    expect(handbookNeighbours(entries, 'b').previous?.slug).toBe('a');
    expect(handbookNeighbours(entries, 'b').next).toBeUndefined();
    expect(handbookNeighbours(entries, 'nope')).toEqual({});
  });
});
