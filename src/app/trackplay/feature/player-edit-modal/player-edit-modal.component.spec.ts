import {
  mockPlayer,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { setupModalSpec } from '../../../@shared/testing/modal-spec';
import { TrackplayActions } from '../../data';
import { TrackplayPlayerEditModalComponent } from './player-edit-modal.component';

describe('TrackplayPlayerEditModalComponent', () => {
  let component: TrackplayPlayerEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    ({ component, dispatch } = setupModalSpec(
      TrackplayPlayerEditModalComponent,
      { trackplay: state }
    ));
  };

  it('dispatches createPlayer in create mode', () => {
    setup();

    component.patch({ name: 'Bob' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });

  it('trims the name before creating', () => {
    setup();

    component.patch({ name: '  Bob  ' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });

  it('dispatches renamePlayer when editing an existing player', () => {
    setup(
      mockTrackplayState({
        players: { 'player-1': mockPlayer({ id: 'player-1', name: 'Alice' }) },
      })
    );
    // The componentProp writes into a signal, so the draft seeds reactively —
    // no ngOnInit to call (and none to forget).
    component.playerId = 'player-1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft().name).toBe('Alice');

    component.patch({ name: 'Alicia' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.renamePlayer('player-1', 'Alicia')
    );
  });

  it('does not dispatch for a blank name', () => {
    setup();

    component.patch({ name: ' '.repeat(3) });
    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('blurs the field and confirms on enter', () => {
    setup();
    const blur = vi.fn();

    component.patch({ name: 'Bob' });
    component.onEnter({ target: { blur } } as unknown as Event);

    expect(blur).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });
});
