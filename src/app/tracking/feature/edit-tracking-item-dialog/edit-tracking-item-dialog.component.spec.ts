import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemDialogHost } from '../../../@shared/data/item-dialogs/item-dialog-host';
import { createTrackingItem } from '../../util/tracking.factory';
import { selectTrackingListItems, TrackingActions } from '../../data';
import { EditTrackingItemDialogComponent } from './edit-tracking-item-dialog.component';

describe('EditTrackingItemDialogComponent', () => {
  let store: MockStore;
  let component: EditTrackingItemDialogComponent;
  let host: ItemDialogHost;

  const seed = createTrackingItem('Task');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditTrackingItemDialogComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectTrackingListItems, []);
    store.refreshState();
    host = TestBed.inject(ItemDialogHost);
    host.open({ item: seed, listId: '_tracking', editMode: 'update' });
    component = TestBed.createComponent(
      EditTrackingItemDialogComponent
    ).componentInstance;
  });

  it('toggles a notification onto the local draft from the default config', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateNotifications('onStart', true);

    expect(component.draft()?.notifications).toEqual({
      onStart: true,
      onStop: false,
      onProcess: false,
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('merges a toggle onto the existing notification config', () => {
    component.updateNotifications('onStop', true);
    component.updateNotifications('onProcess', true);

    expect(component.draft()?.notifications).toEqual({
      onStart: false,
      onStop: true,
      onProcess: true,
    });
  });

  it('saves the draft and hides the dialog on confirm', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateNotifications('onStart', true);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.addOrUpdateItem({
        ...seed,
        notifications: { onStart: true, onStop: false, onProcess: false },
      })
    );
    expect(host.request()).toBeNull();
  });
});
