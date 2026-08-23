export type HandbookGroup = 'einstieg' | 'programme' | 'system';

export type HandbookSectionKind =
  'why' | 'steps' | 'features' | 'gestures' | 'pitfalls' | 'seealso' | 'plain';

export interface HandbookEntry {
  slug: string;
  title: string;
  plain: string;
  route: string;
  group: HandbookGroup;
  summary: string;
  tags: string[];
  text: string;
}

export interface HandbookIndex {
  language: string;
  pages: HandbookEntry[];
}

interface HandbookProseBlock {
  type: 'p' | 'h3' | 'note';
  html: string;
}

interface HandbookListBlock {
  type: 'ul' | 'ol';
  items: string[];
}

interface HandbookFigureBlock {
  type: 'figure';
  img: string;
  caption: string;
}

type HandbookBlock =
  HandbookProseBlock | HandbookListBlock | HandbookFigureBlock;

interface HandbookSection {
  kind: HandbookSectionKind;
  heading: string;
  blocks: HandbookBlock[];
}

export interface HandbookPageContent {
  slug: string;
  title: string;
  plain: string;
  route: string;
  summary: string;
  shotsStale?: boolean;
  sections: HandbookSection[];
}
