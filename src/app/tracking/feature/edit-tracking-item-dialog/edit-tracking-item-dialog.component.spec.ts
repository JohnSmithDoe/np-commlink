import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../../testing/tracking.test-data';
import { createTrackingItem } from '../../util/tracking.factory';
import { TrackingActions } from '../../data';
import { EditTrackingItemDialogComponent } from './edit-tracking-item-dialog.component';

describe('EditTrackingItemDialogComponent', () => {
  let store: MockStore;
  let component: EditTrackingItemDialogComponent;
  let host: ItemDialogService;

  const seed = createTrackingItem('Task');
  const sibling = mockTrackingItem({ id: 'other', name: 'Standup' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditTrackingItemDialogComponent],
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideMockStore({
          initialState: mockKernelState({
            tracking: mockTrackingState({ items: [sibling, seed] }),
          }),
        }),
      ],
    });
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_tracking', editMode: 'update' });
    component = TestBed.createComponent(
      EditTrackingItemDialogComponent
    ).componentInstance;
  });

  it('saves the draft and hides the dialog on confirm', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.form.name().value.set('Renamed');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.addOrUpdateItem({ ...seed, name: 'Renamed' })
    );
    expect(host.request()).toBeNull();
  });

  it('saves a tracked-time correction as break', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const tracked = {
      ...seed,
      startTime: '2026-10-10T08:00:00+02:00',
      trackedTimeInSeconds: 3600,
    };
    host.open({ item: tracked, listId: '_tracking', editMode: 'update' });

    component.adjustTrackedTime(-15 * 60);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.addOrUpdateItem({
        ...tracked,
        trackedTimeInSeconds: 2700,
        breakInSeconds: 900,
      })
    );
  });

  it('refuses a name a sibling activity already has', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Standup');

    expect(component.canSave()).toBe(false);
  });
});
