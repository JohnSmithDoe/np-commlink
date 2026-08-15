const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}[️]?)*/gu;

export const extractEmoji = (text: string): string[] => [
  ...new Set(text.match(EMOJI_SEQUENCE)),
];

const orderedWithin = (
  text: string,
  start: number,
  end: number
): { from: number; to: number } => {
  const clamp = (at: number) => Math.max(0, Math.min(at, text.length));
  const a = clamp(start);
  const b = clamp(end);
  return { from: Math.min(a, b), to: Math.max(a, b) };
};

export const replaceRange = (
  text: string,
  glyph: string,
  start: number,
  end: number
): string => {
  const { from, to } = orderedWithin(text, start, end);
  return text.slice(0, from) + glyph + text.slice(to);
};

const lastCodePointLength = (head: string): number =>
  ([...head].at(-1) ?? '').length;

const sequenceAround = (
  text: string,
  caret: number
): { start: number; end: number } | undefined => {
  for (const match of text.matchAll(EMOJI_SEQUENCE)) {
    const start = match.index;
    const end = start + match[0].length;
    if (start < caret && caret <= end) return { start, end };
  }
  return undefined;
};

export const deleteRange = (
  text: string,
  start: number,
  end: number
): { text: string; caret: number } => {
  const { from, to } = orderedWithin(text, start, end);
  if (from < to)
    return { text: text.slice(0, from) + text.slice(to), caret: from };
  if (from === 0) return { text, caret: 0 };

  const sequence = sequenceAround(text, from);
  const head = sequence
    ? sequence.start
    : from - lastCodePointLength(text.slice(0, from));
  const tail = sequence ? sequence.end : from;

  return { text: text.slice(0, head) + text.slice(tail), caret: head };
};
