import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { MagnitudeId } from './money.types';

export const MAGNITUDE_VALUE: Record<MagnitudeId, number> = {
  one: 1,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
};

export const MAGNITUDE_CHIPS: readonly { id: MagnitudeId; labelKey: Marker }[] =
  [
    { id: 'one', labelKey: marker('coprocessor.money.chip.one') },
    { id: 'thousand', labelKey: marker('coprocessor.money.chip.thousand') },
    { id: 'million', labelKey: marker('coprocessor.money.chip.million') },
    { id: 'billion', labelKey: marker('coprocessor.money.chip.billion') },
    { id: 'trillion', labelKey: marker('coprocessor.money.chip.trillion') },
  ];

export const MAGNITUDE_SCALE_KEYS: Record<
  MagnitudeId,
  { one: Marker; many: Marker }
> = {
  one: {
    one: marker('coprocessor.money.scale.one.one'),
    many: marker('coprocessor.money.scale.many.one'),
  },
  thousand: {
    one: marker('coprocessor.money.scale.one.thousand'),
    many: marker('coprocessor.money.scale.many.thousand'),
  },
  million: {
    one: marker('coprocessor.money.scale.one.million'),
    many: marker('coprocessor.money.scale.many.million'),
  },
  billion: {
    one: marker('coprocessor.money.scale.one.billion'),
    many: marker('coprocessor.money.scale.many.billion'),
  },
  trillion: {
    one: marker('coprocessor.money.scale.one.trillion'),
    many: marker('coprocessor.money.scale.many.trillion'),
  },
};
