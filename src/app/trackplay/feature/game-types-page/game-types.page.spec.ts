import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  mockGameType,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayGameTypesPage } from './game-types.page';

describe('TrackplayGameTypesPage', () => {
  let component: TrackplayGameTypesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameTypesPage, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayGameTypesPage
    ).componentInstance;
  };

  it('dispatches enterGameTypesPage on ionViewWillEnter', () => {
    setup();

    component.ionViewWillEnter();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.enterGameTypesPage()
    );
  });

  it('dispatches deleteGameType with the type', () => {
    const type = mockGameType({ id: 'skat', name: 'Skat' });
    setup();

    component.deleteType(type);

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.deleteGameType(type)
    );
  });

  it('exposes the default (undeletable) type id', () => {
    setup();

    expect(component.defaultTypeId).toBe('default');
  });
});
