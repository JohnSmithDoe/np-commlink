import { TestBed } from '@angular/core/testing';
import {
  ModalController,
  ToggleChangeEventDetail,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  mockGameType,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayGameTypeEditDialogComponent } from './game-type-edit-dialog.component';

const toggle = (checked: boolean): ToggleChangeEventDetail =>
  ({ checked }) as ToggleChangeEventDetail;

describe('TrackplayGameTypeEditDialogComponent', () => {
  let component: TrackplayGameTypeEditDialogComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [
        TrackplayGameTypeEditDialogComponent,
        TranslateModule.forRoot(),
      ],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dismiss = vi
      .spyOn(TestBed.inject(ModalController), 'dismiss')
      .mockResolvedValue(true);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayGameTypeEditDialogComponent
    ).componentInstance;
  };

  it('dispatches createGameType in create mode', () => {
    setup();

    component.onName('Canasta');
    component.onWinHigh(toggle(false));
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.createGameType('Canasta', false)
    );
    expect(dismiss).toHaveBeenCalled();
  });

  it('does not dispatch for a blank name', () => {
    setup();

    component.onName(' '.repeat(3));
    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('seeds signals and dispatches updateGameType when editing', () => {
    setup(
      mockTrackplayState({
        gameTypes: {
          ...mockTrackplayState().gameTypes,
          skat: mockGameType({ id: 'skat', name: 'Skat', winHigh: true }),
        },
      })
    );

    component.gameTypeId = 'skat';
    component.ngOnInit();

    expect(component.name()).toBe('Skat');
    expect(component.winHigh()).toBe(true);

    component.onName('Skat 2');
    component.onWinHigh(toggle(false));
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
