import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  mockGame,
  mockPlayer,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayGameEditModalComponent } from './game-edit-modal.component';

const editState = () =>
  mockTrackplayState({
    games: {
      g1: mockGame({
        id: 'g1',
        name: 'Skat',
        type: 'default',
        players: ['p1'],
      }),
    },
    players: { p1: mockPlayer({ id: 'p1', name: 'Alice' }) },
  });

describe('TrackplayGameEditModalComponent', () => {
  let component: TrackplayGameEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameEditModalComponent, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayGameEditModalComponent
    ).componentInstance;
  };

  it('dispatches createGame in create mode', () => {
    setup();

    component.patch({ name: 'New game' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.createGame('New game', [])
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('creates with the preset player ids', () => {
    setup();

    component.presetPlayerIds = ['p1'];
    component.patch({ name: 'New game' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.createGame('New game', ['p1'])
    );
  });

  // Unreachable via the UI (the OK button is `[disabled]="!canSave()"`), but the
  // guard is uniform across all the modal dialogs now: confirm with an invalid
  // draft is a no-op and leaves the dialog open. This dialog used to be the odd
  // one out, dismissing anyway.
  it('neither creates nor dismisses without a name', () => {
    setup();

    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });

  // The componentProps write into signals, so the draft seeds reactively — no
  // ngOnInit to call (and none to forget).
  it('seeds the draft from the edited game', () => {
    setup(editState());

    component.gameId = 'g1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft()).toEqual({
      name: 'Skat',
      typeId: 'default',
      playerIds: ['p1'],
    });
    // The stable original selection drives the player-select display order.
    expect(component.initialPlayerIds()).toEqual(['p1']);
  });

  it('dispatches renameGame when the name changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ name: 'Doppelkopf' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.renameGame('g1', 'Doppelkopf')
    );
  });

  it('dispatches changeGameType when the type changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ typeId: 'skat' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.changeGameType('g1', 'skat')
    );
  });

  it('dispatches setGamePlayers when the roster changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ playerIds: ['p1', 'p2'] });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.setGamePlayers('g1', ['p1', 'p2'])
    );
  });

  it('computes canSave and canPlay from name and roster', () => {
    setup();

    expect(component.canSave()).toBe(false);
    expect(component.canPlay()).toBe(false);

    component.patch({ name: 'Skat' });
    expect(component.canSave()).toBe(true);
    expect(component.canPlay()).toBe(false);

    component.patch({ playerIds: ['p1'] });
    expect(component.canPlay()).toBe(true);
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
