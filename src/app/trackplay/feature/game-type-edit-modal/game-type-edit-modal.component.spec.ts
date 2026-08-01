import {
  mockGameType,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { setupModalSpec } from '../../../@shared/testing/modal-spec';
import { TrackplayActions } from '../../data';
import { TrackplayGameTypeEditModalComponent } from './game-type-edit-modal.component';

describe('TrackplayGameTypeEditModalComponent', () => {
  let component: TrackplayGameTypeEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      TrackplayGameTypeEditModalComponent,
      { trackplay: state }
    ));
  };

  it('dispatches createGameType in create mode', () => {
    setup();

    component.patch({ name: 'Canasta', winHigh: false });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.createGameType('Canasta', false)
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('does not dispatch for a blank name', () => {
    setup();

    component.patch({ name: ' '.repeat(3) });
    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
  });

  // The componentProp writes into a signal, so the draft seeds reactively — no
  // ngOnInit to call (and none to forget).
  it('seeds the draft from the id alone and dispatches updateGameType', () => {
    setup(
      mockTrackplayState({
        gameTypes: {
          ...mockTrackplayState().gameTypes,
          skat: mockGameType({ id: 'skat', name: 'Skat', winHigh: true }),
        },
      })
    );

    component.gameTypeId = 'skat';

    expect(component.isEdit()).toBe(true);
    expect(component.draft()).toEqual({ name: 'Skat', winHigh: true });

    component.patch({ name: 'Skat 2', winHigh: false });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGameType({
        id: 'skat',
        name: 'Skat 2',
        winHigh: false,
      })
    );
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
