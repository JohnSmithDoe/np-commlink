import { HandbookEntry } from '../model/handbook.types';

interface SnippetPart {
  text: string;
  match: boolean;
}

export interface HandbookHit {
  entry: HandbookEntry;
  score: number;
  snippet: SnippetPart[];
}

const WHITESPACE = /\s+/;
const ELLIPSIS = '…';

const SNIPPET_LENGTH = 170;
const SNIPPET_LEAD = 40;

const TITLE_SCORE = 8;
const TAG_SCORE = 4;
const SUMMARY_SCORE = 2;
const TEXT_SCORE = 1;

interface Occurrence {
  at: number;
  length: number;
}

export const handbookTerms = (query: string): string[] =>
  query
    .toLowerCase()
    .split(WHITESPACE)
    .filter((term) => term.length > 0);

const scoreTerm = (entry: HandbookEntry, term: string): number => {
  if (`${entry.title} ${entry.plain}`.toLowerCase().includes(term))
    return TITLE_SCORE;
  if (entry.tags.some((tag) => tag.toLowerCase().includes(term)))
    return TAG_SCORE;
  if (entry.summary.toLowerCase().includes(term)) return SUMMARY_SCORE;
  if (entry.text.toLowerCase().includes(term)) return TEXT_SCORE;
  return 0;
};

const occurrenceFrom = (
  lowered: string,
  terms: readonly string[],
  from: number
): Occurrence | undefined => {
  let earliest: Occurrence | undefined;
  for (const term of terms) {
    const at = lowered.indexOf(term, from);
    if (at === -1) continue;
    if (!earliest || at < earliest.at) earliest = { at, length: term.length };
  }
  return earliest;
};

const wordStart = (source: string, at: number): number =>
  at <= 0 ? 0 : source.lastIndexOf(' ', at) + 1;

const wordEnd = (source: string, at: number): number => {
  if (at >= source.length) return source.length;
  const space = source.indexOf(' ', at);
  return space === -1 ? source.length : space;
};

const highlight = (
  excerpt: string,
  terms: readonly string[]
): SnippetPart[] => {
  const lowered = excerpt.toLowerCase();
  const parts: SnippetPart[] = [];
  let cursor = 0;
  let found = occurrenceFrom(lowered, terms, cursor);

  while (found) {
    if (found.at > cursor)
      parts.push({ text: excerpt.slice(cursor, found.at), match: false });
    parts.push({
      text: excerpt.slice(found.at, found.at + found.length),
      match: true,
    });
    cursor = found.at + found.length;
    found = occurrenceFrom(lowered, terms, cursor);
  }

  if (cursor < excerpt.length)
    parts.push({ text: excerpt.slice(cursor), match: false });
  return parts;
};

const snippetOf = (
  entry: HandbookEntry,
  terms: readonly string[]
): SnippetPart[] => {
  const source = occurrenceFrom(entry.text.toLowerCase(), terms, 0)
    ? entry.text
    : entry.summary;
  const found = occurrenceFrom(source.toLowerCase(), terms, 0);
  if (!found)
    return [
      {
        text: source.slice(0, wordEnd(source, SNIPPET_LENGTH)),
        match: false,
      },
    ];

  const start = wordStart(source, found.at - SNIPPET_LEAD);
  const end = wordEnd(
    source,
    Math.max(start + SNIPPET_LENGTH, found.at + found.length)
  );
  const parts = highlight(source.slice(start, end), terms);

  if (start > 0) parts.unshift({ text: `${ELLIPSIS} `, match: false });
  if (end < source.length) parts.push({ text: ` ${ELLIPSIS}`, match: false });
  return parts;
};

export const searchHandbook = (
  entries: readonly HandbookEntry[],
  query: string
): HandbookHit[] => {
  const terms = handbookTerms(query);
  if (terms.length === 0) return [];

  const hits: HandbookHit[] = [];
  for (const entry of entries) {
    let score = 0;
    for (const term of terms) {
      const termScore = scoreTerm(entry, term);
      if (termScore === 0) {
        score = 0;
        break;
      }
      score += termScore;
    }
    if (score > 0)
      hits.push({ entry, score, snippet: snippetOf(entry, terms) });
  }
  return hits.toSorted((first, second) => second.score - first.score);
};
