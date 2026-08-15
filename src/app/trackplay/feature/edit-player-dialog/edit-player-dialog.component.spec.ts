import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { PlayersActions } from '../../data';
import { PLAYERS_LIST_ID } from '../../model/trackplay.types';
import {
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { EditPlayerDialogComponent } from './edit-player-dialog.component';

describe('EditPlayerDialogComponent', () => {
  let component: EditPlayerDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const alice = mockPlayer({ id: 'p1', name: 'Alice' });
  const bob = mockPlayer({ id: 'p2', name: 'Bob' });

  const setup = (seed = alice, editMode: 'create' | 'update' = 'update') => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          trackplay: mockTrackplayState({
            players: mockPlayersState([alice, bob]),
          }),
        }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: PLAYERS_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditPlayerDialogComponent
    ).componentInstance;
  };

  it('seeds the draft from the request and saves the rename', () => {
    setup();

    expect(component.isOpen()).toBe(true);
    expect(component.draft().name).toBe('Alice');

    component.form.name().value.set('Alicia');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      PlayersActions.addOrUpdateItem({ ...alice, name: 'Alicia' })
    );
    expect(host.request()).toBeNull();
  });

  it('refuses a name another player already has', () => {
    setup();

    component.form.name().value.set('Bob');

    expect(component.canSave()).toBe(false);
  });

  it('refuses a blank name', () => {
    setup(mockPlayer({ id: 'new', name: '' }), 'create');

    expect(component.canSave()).toBe(false);

    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('stays closed for another list id', () => {
    setup();
    host.open({ item: alice, listId: '_shopping', editMode: 'update' });

    expect(component.isOpen()).toBe(false);
  });
});
