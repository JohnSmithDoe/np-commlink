const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}[️]?)*/gu;

export const extractEmoji = (text: string): string[] => [
  ...new Set(text.match(EMOJI_SEQUENCE)),
];

export const insertAt = (text: string, glyph: string, caret: number): string =>
  text.slice(0, caret) + glyph + text.slice(caret);
