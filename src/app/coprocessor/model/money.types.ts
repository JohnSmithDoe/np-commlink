import { Marker } from '../../@shared/model/app.types';

export type DerivedUnit = 'length' | 'mass' | 'area' | 'volume' | 'duration';
export type AnchorFamily = DerivedUnit | 'vehicles';
export type MoneyGroup = 'time' | 'things' | 'physical' | 'absurd';

export type MagnitudeId =
  'one' | 'thousand' | 'million' | 'billion' | 'trillion';

export type MoneyAnchor = {
  id: string;
  labelKey: Marker;
  family: AnchorFamily;
  value: number;
};

export type MoneyReference = {
  id: string;
  group: MoneyGroup;
  emoji: string;
  labelKey: Marker;
  basisKey: Marker;
  unitKey: Marker;
  rate: number;
  year?: number;
  derive?: { factor: number; unit: DerivedUnit };
  family?: AnchorFamily;
};
