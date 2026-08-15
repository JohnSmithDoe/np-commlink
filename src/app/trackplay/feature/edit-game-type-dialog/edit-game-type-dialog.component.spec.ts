import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GameTypesActions } from '../../data';
import { GAME_TYPES_LIST_ID } from '../../model/trackplay.types';
import {
  mockGameType,
  mockGameTypesState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { createGameType } from '../../util/trackplay.factory';
import { EditGameTypeDialogComponent } from './edit-game-type-dialog.component';

describe('EditGameTypeDialogComponent', () => {
  let component: EditGameTypeDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const skat = mockGameType({ id: 'skat', name: 'Skat', winHigh: true });

  const setup = (seed = skat, editMode: 'create' | 'update' = 'update') => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          trackplay: mockTrackplayState({
            gameTypes: mockGameTypesState([skat]),
          }),
        }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: GAME_TYPES_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditGameTypeDialogComponent
    ).componentInstance;
  };

  it('saves name and win direction as one item', () => {
    setup();

    expect(component.draft()).toEqual(skat);

    component.form.name().value.set('Skat 2');
    component.form.winHigh().value.set(false);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      GameTypesActions.addOrUpdateItem({
        ...skat,
        name: 'Skat 2',
        winHigh: false,
      })
    );
    expect(host.request()).toBeNull();
  });

  it('defaults a new type to win-high', () => {
    setup(createGameType('', true), 'create');

    expect(component.draft().winHigh).toBe(true);
    expect(component.canSave()).toBe(false);
  });
});
