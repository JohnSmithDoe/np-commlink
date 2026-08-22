import { HandbookEntry } from '../model/handbook.types';
import { handbookTerms, searchHandbook } from './handbook-search';

const CHRONO: HandbookEntry = {
  slug: 'chrono',
  title: 'CHRONO',
  plain: 'Zeiterfassung',
  route: '/tracking',
  group: 'programme',
  summary: 'Zeiten starten, pausieren und stoppen.',
  tags: ['zeit', 'timer'],
  text: 'Ein Timer läuft weiter, bis du ihn stoppst. Die Pause zählt nicht mit, und der Tageswert steht oben.',
};

const AGENDA: HandbookEntry = {
  slug: 'agenda',
  title: 'AGENDA',
  plain: 'Aufgaben',
  route: '/tasks',
  group: 'programme',
  summary: 'Aufgaben mit Fälligkeit und Priorität.',
  tags: ['aufgaben'],
  text: 'Eine Aufgabe bekommt ein Fälligkeitsdatum. Der Timer spielt hier keine Rolle.',
};

const ENTRIES = [CHRONO, AGENDA];

describe('handbookTerms', () => {
  it('splits on whitespace and drops the empties a trailing space leaves', () => {
    expect(handbookTerms('  Timer   Pause ')).toEqual(['timer', 'pause']);
  });

  it('reads a blank query as no terms at all', () => {
    expect(handbookTerms(' '.repeat(3))).toEqual([]);
  });
});

describe('searchHandbook', () => {
  it('answers a blank query with nothing rather than everything', () => {
    expect(searchHandbook(ENTRIES, '')).toEqual([]);
  });

  it('requires every term to match, not just one', () => {
    const hits = searchHandbook(ENTRIES, 'timer pause');

    expect(hits.map((hit) => hit.entry.slug)).toEqual(['chrono']);
  });

  it('matches the plain name as well as the deck one', () => {
    expect(searchHandbook(ENTRIES, 'zeiterfassung')[0]?.entry.slug).toBe(
      'chrono'
    );
  });

  it('ranks a title match above a body-only match', () => {
    const hits = searchHandbook(ENTRIES, 'agenda timer');

    expect(hits.map((hit) => hit.entry.slug)).toEqual(['agenda']);
    expect(
      searchHandbook(ENTRIES, 'timer').map((hit) => hit.entry.slug)
    ).toEqual(['chrono', 'agenda']);
  });

  it('highlights the term inside the snippet it cut', () => {
    const [hit] = searchHandbook(ENTRIES, 'pause');

    expect(hit?.snippet.some((part) => part.match)).toBe(true);
    expect(hit?.snippet.find((part) => part.match)?.text.toLowerCase()).toBe(
      'pause'
    );
  });

  it('cuts the snippet from the summary when the body holds no term', () => {
    const [hit] = searchHandbook(ENTRIES, 'zeit');

    expect(hit?.snippet.map((part) => part.text).join('')).toContain(
      'Zeiten starten'
    );
  });
});
