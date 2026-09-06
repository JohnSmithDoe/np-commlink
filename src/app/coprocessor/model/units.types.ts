import { Marker } from '../../@shared/model/app.types';

export type QuantityId =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'volume'
  | 'area'
  | 'speed'
  | 'data'
  | 'time';

export type Unit = {
  id: string;
  symbol: string;
  nameKey: Marker;
  factor: number;
  offset?: number;
};

export type Quantity = {
  id: QuantityId;
  nameKey: Marker;
  units: readonly Unit[];
  defaultFrom: string;
  defaultTo: string;
};
