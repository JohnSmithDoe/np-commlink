import { BaseItem } from './base-item.types';

export type PersonId = string;
export type PersonKind = 'person' | 'pet';

export interface PersonRef extends BaseItem {
  kind: PersonKind;
  birthDate?: string;
}
