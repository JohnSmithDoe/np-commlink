import { PersonKind } from '../../@shared/model/person.types';
import { createBaseItem } from '../../@shared/util/app.factory';
import {
  Address,
  PEOPLE_LIST_ID,
  PeopleState,
  Person,
} from '../model/people.types';

export function createPerson(
  name: string,
  kind: PersonKind = 'person'
): Person {
  return { ...createBaseItem(name), kind, sizes: {}, addresses: [] };
}

export function createAddress(): Address {
  return { street: '', postalCode: '', city: '', country: '' };
}

export const initialPeopleState: PeopleState = {
  id: PEOPLE_LIST_ID,
  items: [],
  sort: { sortBy: 'name', sortDirection: 'asc' },
};
