import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { HandbookGroup, HandbookSectionKind } from './handbook.types';

export const HANDBOOK_GROUPS = [
  'einstieg',
  'programme',
  'system',
] as const satisfies readonly HandbookGroup[];

export const HANDBOOK_GROUP_LABEL: Record<HandbookGroup, Marker> = {
  einstieg: marker('handbook.group.einstieg'),
  programme: marker('handbook.group.programme'),
  system: marker('handbook.group.system'),
};

export const HANDBOOK_SECTION_ICON: Partial<
  Record<HandbookSectionKind, string>
> = {
  gestures: 'hand-left-outline',
  pitfalls: 'warning-outline',
};
