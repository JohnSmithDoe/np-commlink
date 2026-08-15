/* ─── why ─────────────────────────────────────────────────────────
 * "Weiter" is asserted to save AND navigate to the same id in one pass:
 * the whole point of the id already existing on the draft is that the two
 * halves no longer have to agree by accident.
 * ───────────────────────────────────────────────────────────────── */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GamesActions } from '../../data';
import { Game, GAMES_LIST_ID } from '../../model/trackplay.types';
import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { EditGameDialogComponent } from './edit-game-dialog.component';

describe('EditGameDialogComponent', () => {
  let component: EditGameDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const skat = mockGame({
    id: 'g1',
    name: 'Skat',
    categoryIds: ['default'],
    playerIds: ['p1'],
  });

  const setup = (
    seed: Game = skat,
    editMode: 'create' | 'update' = 'update'
  ) => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          trackplay: mockTrackplayState({
            games: mockGamesState([skat]),
            players: mockPlayersState([
              mockPlayer({ id: 'p1', name: 'Alice' }),
              mockPlayer({ id: 'p2', name: 'Bob' }),
            ]),
          }),
        }),
      ],
    });
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: GAMES_LIST_ID, editMode });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    component = TestBed.createComponent(
      EditGameDialogComponent
    ).componentInstance;
  };

  it('saves name, type and roster as one item', () => {
    setup();

    expect(component.gameTypeId()).toBe('default');
    expect(component.seedPlayerIds()).toEqual(['p1']);

    component.form.name().value.set('Doppelkopf');
    component.setGameType({
      detail: { value: 'skat' },
    } as CustomEvent<{ value: string }> as never);
    component.setPlayers(['p1', 'p2']);
    component.confirm();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      GamesActions.addOrUpdateItem({
        ...skat,
        name: 'Doppelkopf',
        categoryIds: ['skat'],
        playerIds: ['p1', 'p2'],
      })
    );
  });

  it('offers players sorted by name', () => {
    setup();

    expect(component.players().map((player) => player.name)).toEqual([
      'Alice',
      'Bob',
    ]);
  });

  it('needs a name to save and a roster to play', () => {
    setup(mockGame({ id: 'new', name: '', playerIds: [] }), 'create');

    expect(component.canSave()).toBe(false);
    expect(component.canPlay()).toBe(false);

    component.form.name().value.set('Canasta');
    expect(component.canSave()).toBe(true);
    expect(component.canPlay()).toBe(false);

    component.setPlayers(['p1']);
    expect(component.canPlay()).toBe(true);
  });

  it('saves and navigates to the game the draft already names', () => {
    setup(mockGame({ id: 'new', name: '', playerIds: ['p1'] }), 'create');
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    component.form.name().value.set('Canasta');
    component.playNow();

    expect(dispatch).toHaveBeenCalledWith(
      GamesActions.addOrUpdateItem(
        expect.objectContaining({ id: 'new', name: 'Canasta' }) as never
      )
    );
    expect(navigate).toHaveBeenCalledWith(['/trackplay/game', 'new']);
    expect(host.request()).toBeNull();
  });

  it('neither saves nor navigates without a roster', () => {
    setup(mockGame({ id: 'new', name: 'Canasta', playerIds: [] }), 'create');
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    component.playNow();

    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
