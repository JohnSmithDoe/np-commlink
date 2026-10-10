import { PEOPLE_LIST_ID, PeopleState, Person } from '../model/people.types';

export function mockPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    name: 'Martin',
    kind: 'person',
    createdAt: '2026-01-01T10:00:00.000Z',
    sizes: {},
    addresses: [],
    ...overrides,
  };
}

export function mockPeopleState(
  items: Person[] = [mockPerson()],
  overrides: Partial<PeopleState> = {}
): PeopleState {
  return { id: PEOPLE_LIST_ID, items, ...overrides };
}
