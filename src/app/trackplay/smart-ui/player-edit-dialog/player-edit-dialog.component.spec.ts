import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  mockPlayer,
  mockTrackplayState,
} from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data/trackplay.actions';
import { TrackplayPlayerEditDialogComponent } from './player-edit-dialog.component';

describe('TrackplayPlayerEditDialogComponent', () => {
  let component: TrackplayPlayerEditDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerEditDialogComponent, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    vi.spyOn(TestBed.inject(ModalController), 'dismiss').mockResolvedValue(
      true
    );
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayPlayerEditDialogComponent
    ).componentInstance;
  };

  it('dispatches createPlayer in create mode', () => {
    setup();

    component.onName('Bob');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });

  it('trims the name before creating', () => {
    setup();

    component.onName('  Bob  ');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });

  it('dispatches renamePlayer when editing an existing player', () => {
    setup(
      mockTrackplayState({
        players: { 'player-1': mockPlayer({ id: 'player-1', name: 'Alice' }) },
      })
    );
    component.playerId = 'player-1';
    component.ngOnInit();

    expect(component.name()).toBe('Alice');

    component.onName('Alicia');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.renamePlayer('player-1', 'Alicia')
    );
  });

  it('does not dispatch for a blank name', () => {
    setup();

    component.onName('   ');
    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('blurs the field and confirms on enter', () => {
    setup();
    const blur = vi.fn();

    component.onName('Bob');
    component.onEnter({ target: { blur } } as unknown as Event);

    expect(blur).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.createPlayer('Bob'));
  });
});
