/* ─── why ─────────────────────────────────────────────────────────
 * `HEXAGRAMS` is the King Wen sequence, and its `pattern` is the six cast
 * lines read BOTTOM to top, 1 for yang. The order is not decorative: the
 * Unicode block runs ䷀..䷿ in exactly this sequence, so the glyph is
 * `0x4DC0 + number - 1` and no record carries a character that could drift
 * from its own number.
 *
 * The table was generated and checked against three invariants rather than
 * typed: the 64 patterns are a bijection onto all six-bit words, fourteen
 * anchors hold (the eight doubled trigrams plus 11/12 and 63/64), and every
 * King Wen pair is the vertical REVERSAL of its partner — or, for the eight
 * hexagrams that read the same upside down, its complement.
 * ───────────────────────────────────────────────────────────────── */

import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import {
  CoinFace,
  HexagramRecord,
  LifeNumberRecord,
  LineValue,
  TrigramRecord,
} from './iching.types';

export const TRIGRAMS: readonly TrigramRecord[] = [
  {
    pattern: '111',
    glyph: '☰',
    nameKey: marker('vitals.iching.trigram.qian'),
  },
  {
    pattern: '110',
    glyph: '☱',
    nameKey: marker('vitals.iching.trigram.dui'),
  },
  {
    pattern: '101',
    glyph: '☲',
    nameKey: marker('vitals.iching.trigram.li'),
  },
  {
    pattern: '100',
    glyph: '☳',
    nameKey: marker('vitals.iching.trigram.zhen'),
  },
  {
    pattern: '011',
    glyph: '☴',
    nameKey: marker('vitals.iching.trigram.xun'),
  },
  {
    pattern: '010',
    glyph: '☵',
    nameKey: marker('vitals.iching.trigram.kan'),
  },
  {
    pattern: '001',
    glyph: '☶',
    nameKey: marker('vitals.iching.trigram.gen'),
  },
  {
    pattern: '000',
    glyph: '☷',
    nameKey: marker('vitals.iching.trigram.kun'),
  },
];

export const HEXAGRAMS: readonly HexagramRecord[] = [
  {
    number: 1,
    pattern: '111111',
    nameKey: marker('vitals.iching.hexagram.1'),
    judgementKey: marker('vitals.iching.judgement.1'),
  },
  {
    number: 2,
    pattern: '000000',
    nameKey: marker('vitals.iching.hexagram.2'),
    judgementKey: marker('vitals.iching.judgement.2'),
  },
  {
    number: 3,
    pattern: '100010',
    nameKey: marker('vitals.iching.hexagram.3'),
    judgementKey: marker('vitals.iching.judgement.3'),
  },
  {
    number: 4,
    pattern: '010001',
    nameKey: marker('vitals.iching.hexagram.4'),
    judgementKey: marker('vitals.iching.judgement.4'),
  },
  {
    number: 5,
    pattern: '111010',
    nameKey: marker('vitals.iching.hexagram.5'),
    judgementKey: marker('vitals.iching.judgement.5'),
  },
  {
    number: 6,
    pattern: '010111',
    nameKey: marker('vitals.iching.hexagram.6'),
    judgementKey: marker('vitals.iching.judgement.6'),
  },
  {
    number: 7,
    pattern: '010000',
    nameKey: marker('vitals.iching.hexagram.7'),
    judgementKey: marker('vitals.iching.judgement.7'),
  },
  {
    number: 8,
    pattern: '000010',
    nameKey: marker('vitals.iching.hexagram.8'),
    judgementKey: marker('vitals.iching.judgement.8'),
  },
  {
    number: 9,
    pattern: '111011',
    nameKey: marker('vitals.iching.hexagram.9'),
    judgementKey: marker('vitals.iching.judgement.9'),
  },
  {
    number: 10,
    pattern: '110111',
    nameKey: marker('vitals.iching.hexagram.10'),
    judgementKey: marker('vitals.iching.judgement.10'),
  },
  {
    number: 11,
    pattern: '111000',
    nameKey: marker('vitals.iching.hexagram.11'),
    judgementKey: marker('vitals.iching.judgement.11'),
  },
  {
    number: 12,
    pattern: '000111',
    nameKey: marker('vitals.iching.hexagram.12'),
    judgementKey: marker('vitals.iching.judgement.12'),
  },
  {
    number: 13,
    pattern: '101111',
    nameKey: marker('vitals.iching.hexagram.13'),
    judgementKey: marker('vitals.iching.judgement.13'),
  },
  {
    number: 14,
    pattern: '111101',
    nameKey: marker('vitals.iching.hexagram.14'),
    judgementKey: marker('vitals.iching.judgement.14'),
  },
  {
    number: 15,
    pattern: '001000',
    nameKey: marker('vitals.iching.hexagram.15'),
    judgementKey: marker('vitals.iching.judgement.15'),
  },
  {
    number: 16,
    pattern: '000100',
    nameKey: marker('vitals.iching.hexagram.16'),
    judgementKey: marker('vitals.iching.judgement.16'),
  },
  {
    number: 17,
    pattern: '100110',
    nameKey: marker('vitals.iching.hexagram.17'),
    judgementKey: marker('vitals.iching.judgement.17'),
  },
  {
    number: 18,
    pattern: '011001',
    nameKey: marker('vitals.iching.hexagram.18'),
    judgementKey: marker('vitals.iching.judgement.18'),
  },
  {
    number: 19,
    pattern: '110000',
    nameKey: marker('vitals.iching.hexagram.19'),
    judgementKey: marker('vitals.iching.judgement.19'),
  },
  {
    number: 20,
    pattern: '000011',
    nameKey: marker('vitals.iching.hexagram.20'),
    judgementKey: marker('vitals.iching.judgement.20'),
  },
  {
    number: 21,
    pattern: '100101',
    nameKey: marker('vitals.iching.hexagram.21'),
    judgementKey: marker('vitals.iching.judgement.21'),
  },
  {
    number: 22,
    pattern: '101001',
    nameKey: marker('vitals.iching.hexagram.22'),
    judgementKey: marker('vitals.iching.judgement.22'),
  },
  {
    number: 23,
    pattern: '000001',
    nameKey: marker('vitals.iching.hexagram.23'),
    judgementKey: marker('vitals.iching.judgement.23'),
  },
  {
    number: 24,
    pattern: '100000',
    nameKey: marker('vitals.iching.hexagram.24'),
    judgementKey: marker('vitals.iching.judgement.24'),
  },
  {
    number: 25,
    pattern: '100111',
    nameKey: marker('vitals.iching.hexagram.25'),
    judgementKey: marker('vitals.iching.judgement.25'),
  },
  {
    number: 26,
    pattern: '111001',
    nameKey: marker('vitals.iching.hexagram.26'),
    judgementKey: marker('vitals.iching.judgement.26'),
  },
  {
    number: 27,
    pattern: '100001',
    nameKey: marker('vitals.iching.hexagram.27'),
    judgementKey: marker('vitals.iching.judgement.27'),
  },
  {
    number: 28,
    pattern: '011110',
    nameKey: marker('vitals.iching.hexagram.28'),
    judgementKey: marker('vitals.iching.judgement.28'),
  },
  {
    number: 29,
    pattern: '010010',
    nameKey: marker('vitals.iching.hexagram.29'),
    judgementKey: marker('vitals.iching.judgement.29'),
  },
  {
    number: 30,
    pattern: '101101',
    nameKey: marker('vitals.iching.hexagram.30'),
    judgementKey: marker('vitals.iching.judgement.30'),
  },
  {
    number: 31,
    pattern: '001110',
    nameKey: marker('vitals.iching.hexagram.31'),
    judgementKey: marker('vitals.iching.judgement.31'),
  },
  {
    number: 32,
    pattern: '011100',
    nameKey: marker('vitals.iching.hexagram.32'),
    judgementKey: marker('vitals.iching.judgement.32'),
  },
  {
    number: 33,
    pattern: '001111',
    nameKey: marker('vitals.iching.hexagram.33'),
    judgementKey: marker('vitals.iching.judgement.33'),
  },
  {
    number: 34,
    pattern: '111100',
    nameKey: marker('vitals.iching.hexagram.34'),
    judgementKey: marker('vitals.iching.judgement.34'),
  },
  {
    number: 35,
    pattern: '000101',
    nameKey: marker('vitals.iching.hexagram.35'),
    judgementKey: marker('vitals.iching.judgement.35'),
  },
  {
    number: 36,
    pattern: '101000',
    nameKey: marker('vitals.iching.hexagram.36'),
    judgementKey: marker('vitals.iching.judgement.36'),
  },
  {
    number: 37,
    pattern: '101011',
    nameKey: marker('vitals.iching.hexagram.37'),
    judgementKey: marker('vitals.iching.judgement.37'),
  },
  {
    number: 38,
    pattern: '110101',
    nameKey: marker('vitals.iching.hexagram.38'),
    judgementKey: marker('vitals.iching.judgement.38'),
  },
  {
    number: 39,
    pattern: '001010',
    nameKey: marker('vitals.iching.hexagram.39'),
    judgementKey: marker('vitals.iching.judgement.39'),
  },
  {
    number: 40,
    pattern: '010100',
    nameKey: marker('vitals.iching.hexagram.40'),
    judgementKey: marker('vitals.iching.judgement.40'),
  },
  {
    number: 41,
    pattern: '110001',
    nameKey: marker('vitals.iching.hexagram.41'),
    judgementKey: marker('vitals.iching.judgement.41'),
  },
  {
    number: 42,
    pattern: '100011',
    nameKey: marker('vitals.iching.hexagram.42'),
    judgementKey: marker('vitals.iching.judgement.42'),
  },
  {
    number: 43,
    pattern: '111110',
    nameKey: marker('vitals.iching.hexagram.43'),
    judgementKey: marker('vitals.iching.judgement.43'),
  },
  {
    number: 44,
    pattern: '011111',
    nameKey: marker('vitals.iching.hexagram.44'),
    judgementKey: marker('vitals.iching.judgement.44'),
  },
  {
    number: 45,
    pattern: '000110',
    nameKey: marker('vitals.iching.hexagram.45'),
    judgementKey: marker('vitals.iching.judgement.45'),
  },
  {
    number: 46,
    pattern: '011000',
    nameKey: marker('vitals.iching.hexagram.46'),
    judgementKey: marker('vitals.iching.judgement.46'),
  },
  {
    number: 47,
    pattern: '010110',
    nameKey: marker('vitals.iching.hexagram.47'),
    judgementKey: marker('vitals.iching.judgement.47'),
  },
  {
    number: 48,
    pattern: '011010',
    nameKey: marker('vitals.iching.hexagram.48'),
    judgementKey: marker('vitals.iching.judgement.48'),
  },
  {
    number: 49,
    pattern: '101110',
    nameKey: marker('vitals.iching.hexagram.49'),
    judgementKey: marker('vitals.iching.judgement.49'),
  },
  {
    number: 50,
    pattern: '011101',
    nameKey: marker('vitals.iching.hexagram.50'),
    judgementKey: marker('vitals.iching.judgement.50'),
  },
  {
    number: 51,
    pattern: '100100',
    nameKey: marker('vitals.iching.hexagram.51'),
    judgementKey: marker('vitals.iching.judgement.51'),
  },
  {
    number: 52,
    pattern: '001001',
    nameKey: marker('vitals.iching.hexagram.52'),
    judgementKey: marker('vitals.iching.judgement.52'),
  },
  {
    number: 53,
    pattern: '001011',
    nameKey: marker('vitals.iching.hexagram.53'),
    judgementKey: marker('vitals.iching.judgement.53'),
  },
  {
    number: 54,
    pattern: '110100',
    nameKey: marker('vitals.iching.hexagram.54'),
    judgementKey: marker('vitals.iching.judgement.54'),
  },
  {
    number: 55,
    pattern: '101100',
    nameKey: marker('vitals.iching.hexagram.55'),
    judgementKey: marker('vitals.iching.judgement.55'),
  },
  {
    number: 56,
    pattern: '001101',
    nameKey: marker('vitals.iching.hexagram.56'),
    judgementKey: marker('vitals.iching.judgement.56'),
  },
  {
    number: 57,
    pattern: '011011',
    nameKey: marker('vitals.iching.hexagram.57'),
    judgementKey: marker('vitals.iching.judgement.57'),
  },
  {
    number: 58,
    pattern: '110110',
    nameKey: marker('vitals.iching.hexagram.58'),
    judgementKey: marker('vitals.iching.judgement.58'),
  },
  {
    number: 59,
    pattern: '010011',
    nameKey: marker('vitals.iching.hexagram.59'),
    judgementKey: marker('vitals.iching.judgement.59'),
  },
  {
    number: 60,
    pattern: '110010',
    nameKey: marker('vitals.iching.hexagram.60'),
    judgementKey: marker('vitals.iching.judgement.60'),
  },
  {
    number: 61,
    pattern: '110011',
    nameKey: marker('vitals.iching.hexagram.61'),
    judgementKey: marker('vitals.iching.judgement.61'),
  },
  {
    number: 62,
    pattern: '001100',
    nameKey: marker('vitals.iching.hexagram.62'),
    judgementKey: marker('vitals.iching.judgement.62'),
  },
  {
    number: 63,
    pattern: '101010',
    nameKey: marker('vitals.iching.hexagram.63'),
    judgementKey: marker('vitals.iching.judgement.63'),
  },
  {
    number: 64,
    pattern: '010101',
    nameKey: marker('vitals.iching.hexagram.64'),
    judgementKey: marker('vitals.iching.judgement.64'),
  },
];

export const LIFE_NUMBERS: readonly LifeNumberRecord[] = [
  {
    number: 1,
    nameKey: marker('vitals.iching.life.name.1'),
    traitKey: marker('vitals.iching.life.trait.1'),
  },
  {
    number: 2,
    nameKey: marker('vitals.iching.life.name.2'),
    traitKey: marker('vitals.iching.life.trait.2'),
  },
  {
    number: 3,
    nameKey: marker('vitals.iching.life.name.3'),
    traitKey: marker('vitals.iching.life.trait.3'),
  },
  {
    number: 4,
    nameKey: marker('vitals.iching.life.name.4'),
    traitKey: marker('vitals.iching.life.trait.4'),
  },
  {
    number: 5,
    nameKey: marker('vitals.iching.life.name.5'),
    traitKey: marker('vitals.iching.life.trait.5'),
  },
  {
    number: 6,
    nameKey: marker('vitals.iching.life.name.6'),
    traitKey: marker('vitals.iching.life.trait.6'),
  },
  {
    number: 7,
    nameKey: marker('vitals.iching.life.name.7'),
    traitKey: marker('vitals.iching.life.trait.7'),
  },
  {
    number: 8,
    nameKey: marker('vitals.iching.life.name.8'),
    traitKey: marker('vitals.iching.life.trait.8'),
  },
  {
    number: 9,
    nameKey: marker('vitals.iching.life.name.9'),
    traitKey: marker('vitals.iching.life.trait.9'),
  },
];
export const LINE_LABEL_KEYS: Record<LineValue, Marker> = {
  6: marker('vitals.iching.line.6'),
  7: marker('vitals.iching.line.7'),
  8: marker('vitals.iching.line.8'),
  9: marker('vitals.iching.line.9'),
};

export const COIN_LABEL_KEYS: Record<CoinFace, Marker> = {
  heads: marker('vitals.iching.coin.heads'),
  tails: marker('vitals.iching.coin.tails'),
};
