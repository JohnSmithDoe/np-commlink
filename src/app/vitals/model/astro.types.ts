import { Marker } from '../../@shared/model/app.types';

export type ZodiacSign =
  | 'aquarius'
  | 'pisces'
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn';

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export type ChineseAnimal =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export type ChineseElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export type ChinesePolarity = 'yang' | 'yin';

type KiNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface MonthDay {
  month: number;
  day: number;
}

export interface ZodiacSignRecord {
  sign: ZodiacSign;
  glyph: string;
  element: ZodiacElement;
  from: MonthDay;
  nameKey: Marker;
  traitKey: Marker;
}

export interface ChineseSignRecord {
  animal: ChineseAnimal;
  glyph: string;
  nameKey: Marker;
  traitKey: Marker;
}

export interface AstroAge {
  sign: ZodiacSign;
  fromYear: number;
  toYear: number;
  effectKey: Marker;
}

export interface KiStar {
  number: KiNumber;
  trigram: string;
  nameKey: Marker;
  elementKey: Marker;
  personalityKey: Marker;
  strengthKey: Marker;
  shadowKey: Marker;
}
