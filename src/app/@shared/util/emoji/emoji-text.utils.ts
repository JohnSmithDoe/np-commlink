/**
 * Text operations on emoji, as opposed to the catalog that supplies them:
 * these describe what a name is made of, not what can be picked.
 */

/**
 * A glyph plus whatever binds to it: a variation selector, a skin-tone
 * modifier, or further pictographs joined by ZWJ (👩‍🍳 is three codepoints and
 * one emoji). Matching the base alone would record "👩" for a name that used
 * "👩‍🍳", putting a glyph in the recents row the user never picked.
 */
const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}[️]?)*/gu;

/** Every distinct emoji in a name, first occurrence first. */
export const extractEmoji = (text: string): string[] => [
  ...new Set(text.match(EMOJI_SEQUENCE)),
];

/**
 * Splices a glyph into a name at the caret, so an emoji can go in front of a
 * name that is already typed — appending would force the user to retype it to
 * get "🥛 Milch". A caret past the end (or absent, passed as the length) simply
 * appends.
 */
export const insertAt = (text: string, glyph: string, caret: number): string =>
  text.slice(0, caret) + glyph + text.slice(caret);
