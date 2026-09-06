import { Marker } from '../../@shared/model/app.types';

export type CalcKey = {
  id: string;
  glyph: string;
  emit: string;
  kind: 'digit' | 'operator' | 'action';
  labelKey?: Marker;
};
