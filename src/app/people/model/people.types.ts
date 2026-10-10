import { Timestamp } from '../../@shared/model/app.types';
import { ItemList } from '../../@shared/model/item-list.types';
import { PersonRef } from '../../@shared/model/person.types';

export const PEOPLE_LIST_ID = '_people';

interface ClothingSizes {
  top?: string;
  bottom?: string;
  shoe?: number;
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Person extends PersonRef {
  createdAt: Timestamp;
  sizes: ClothingSizes;
  addresses: Address[];
}

export type PeopleState = Readonly<
  ItemList<Person> & { id: typeof PEOPLE_LIST_ID }
>;
