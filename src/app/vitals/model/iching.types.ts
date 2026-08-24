import { Marker } from '../../@shared/model/app.types';

export type CoinFace = 'heads' | 'tails';

export type LineValue = 6 | 7 | 8 | 9;

export interface CastLine {
  value: LineValue;
  coins: readonly CoinFace[];
}

export interface TrigramRecord {
  pattern: string;
  glyph: string;
  nameKey: Marker;
}

export interface HexagramRecord {
  number: number;
  pattern: string;
  nameKey: Marker;
  judgementKey: Marker;
}

export interface LifeNumberRecord {
  number: number;
  nameKey: Marker;
  traitKey: Marker;
}
