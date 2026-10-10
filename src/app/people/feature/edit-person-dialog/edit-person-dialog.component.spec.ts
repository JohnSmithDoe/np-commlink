import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { PeopleActions } from '../../data';
import { PEOPLE_LIST_ID, Person } from '../../model/people.types';
import { mockPeopleState, mockPerson } from '../../testing/people.test-data';
import { EditPersonDialogComponent } from './edit-person-dialog.component';

const ann = mockPerson({ id: 'ann', name: 'Ann', sizes: { top: 'M' } });

const setup = (seed: Person = ann) => {
  TestBed.configureTestingModule({
    providers: [provideTestingProviders({ people: mockPeopleState([ann]) })],
  });
  TestBed.inject(ItemDialogService).open({
    item: seed,
    listId: PEOPLE_LIST_ID,
    editMode: 'update',
  });
  const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
  const component = TestBed.createComponent(
    EditPersonDialogComponent
  ).componentInstance;
  return { component, dispatch };
};

describe('EditPersonDialogComponent', () => {
  it('saves only the addresses that hold something', () => {
    const { component, dispatch } = setup();

    component.addAddress();
    component.addAddress();
    component.form.addresses[0].street().value.set('Hauptstr. 1');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      PeopleActions.addOrUpdateItem({
        ...ann,
        addresses: [
          { street: 'Hauptstr. 1', postalCode: '', city: '', country: '' },
        ],
      })
    );
  });

  it('keeps no clothing sizes for a pet', () => {
    const { component, dispatch } = setup();

    component.form.kind().value.set('pet');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      PeopleActions.addOrUpdateItem({ ...ann, kind: 'pet', sizes: {} })
    );
  });
});
