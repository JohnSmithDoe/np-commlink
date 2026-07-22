import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { mockTrackingState } from '../../testing/tracking.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackingActions } from '../../data';
import { TrackingPage } from './tracking.page';

describe('TrackingPage', () => {
  let component: TrackingPage;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const setup = (queryParameters: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [TrackingPage, TranslateModule.forRoot()],
      providers: [
        provideTestingProviders({ tracking: mockTrackingState() }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParameters) },
          },
        },
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    component = TestBed.createComponent(TrackingPage).componentInstance;
  };

  it('dispatches enterPage on ionViewWillEnter', () => {
    setup();

    component.ionViewWillEnter();

    expect(dispatch).toHaveBeenCalledWith(TrackingActions.enterPage());
  });

  it('applies a ?cmd deep-link: dispatches the command then strips the param', () => {
    setup({ cmd: 'n1' });

    component.ionViewWillEnter();

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.applyNotificationCommand('n1')
    );
    // Refresh/re-enter safety: the param MUST be cleared (replaceUrl) so a
    // reload or a second ionViewWillEnter cannot re-fire the toggle and flip
    // the tracking item back. This is the whole point of the param-clear.
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: {}, replaceUrl: true })
    );
  });

  it('no-ops the deep-link when ?cmd is absent', () => {
    setup();

    component.ionViewWillEnter();

    const dispatchedTypes = (
      dispatch.mock.calls as Array<[{ type: string }]>
    ).map((c) => c[0].type);
    expect(dispatchedTypes).not.toContain(
      TrackingActions.applyNotificationCommand('x').type
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
