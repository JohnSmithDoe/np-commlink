import { FactoryProvider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReadBeforeWriteService } from '../../@shared/data/persistence/read-before-write.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { PEOPLE } from '../../@shared/util/people/people.token';
import { mockPeopleState, mockPerson } from '../testing/people.test-data';
import { peopleContext } from './people.providers';
import { PEOPLE_STATE_KEY } from './people.selector';

const peopleProvider = peopleContext.providers.find(
  (provider) => (provider as FactoryProvider).provide === PEOPLE
);

describe('PEOPLE', () => {
  const ronja = mockPerson({ id: 'ronja', name: 'Ronja' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({ people: mockPeopleState([ronja]) }),
        peopleProvider!,
      ],
    });
  });

  it('answers nothing until the slice has been read', () => {
    expect(TestBed.inject(PEOPLE)()).toBeUndefined();
  });

  it('answers the roster once the read is recorded', () => {
    const roster = TestBed.inject(PEOPLE);
    TestBed.inject(ReadBeforeWriteService).recordRead(PEOPLE_STATE_KEY);

    expect(roster()).toEqual([ronja]);
  });
});
