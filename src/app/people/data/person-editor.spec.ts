import { FactoryProvider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { PERSON_EDITOR } from '../../@shared/util/people/person-editor.token';
import { mockPeopleState } from '../testing/people.test-data';
import { peopleContext } from './people.providers';

const personEditorProvider = peopleContext.providers.find(
  (provider) => (provider as FactoryProvider).provide === PERSON_EDITOR
);

function seedOf(name?: string): string | undefined {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({
        people: mockPeopleState([], { searchQuery: 'Ronja' }),
      }),
      personEditorProvider!,
    ],
  });
  TestBed.inject(PERSON_EDITOR).create(name);
  return TestBed.inject(ItemDialogService).request()?.item.name;
}

describe('PERSON_EDITOR', () => {
  it('seeds the dialog with the name it is given', () => {
    expect(seedOf('Dunkelzahn')).toBe('Dunkelzahn');
  });

  it("never borrows the people list's own search term", () => {
    expect(seedOf()).toBe('');
  });
});
