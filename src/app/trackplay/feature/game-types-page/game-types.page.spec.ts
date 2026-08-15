import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  mockGameType,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GameTypesActions } from '../../data';
import { TrackplayGameTypesPage } from './game-types.page';

describe('TrackplayGameTypesPage', () => {
  let component: TrackplayGameTypesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameTypesPage],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayGameTypesPage
    ).componentInstance;
  };

  it('dispatches removeItem with the type', () => {
    const type = mockGameType({ id: 'skat', name: 'Skat' });
    setup();

    component.deleteType(type);

    expect(dispatch).toHaveBeenCalledWith(GameTypesActions.removeItem(type));
  });

  it('exposes the default (undeletable) type id', () => {
    setup();

    expect(component.defaultTypeId).toBe('default');
  });
});
