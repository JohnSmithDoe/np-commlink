import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ITrackingItem } from '../../../@shared/types';
import { DialogsActions } from '../../data/dialogs/dialogs.actions';
import { selectEditItemTracking } from '../../data/dialogs/dialogs.selector';
import { selectListItemsTracking } from '../../data/tracking.selector';
import { EditTrackingItemDialogComponent } from './edit-tracking-item-dialog.component';

describe('EditTrackingItemDialogComponent', () => {
  let store: MockStore;
  let component: EditTrackingItemDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditTrackingItemDialogComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectEditItemTracking, undefined);
    store.overrideSelector(selectListItemsTracking, []);
    component = TestBed.createComponent(
      EditTrackingItemDialogComponent
    ).componentInstance;
  });

  it('starts from the default config when the item has no notifications', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateNotifications(null, 'onStart', true);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof DialogsActions.updateItem
    >;
    expect(action.data).toEqual({
      notifications: { onStart: true, onStop: false, onProcess: false },
    });
  });

  it('merges the toggle onto the existing notification config', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const item = {
      id: '1',
      name: 'Task',
      createdAt: '2026-01-01',
      state: 'stopped',
      notifications: { onStart: true, onStop: true, onProcess: false },
    } as ITrackingItem;

    component.updateNotifications(item, 'onProcess', true);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof DialogsActions.updateItem
    >;
    expect(action.data).toEqual({
      notifications: { onStart: true, onStop: true, onProcess: true },
    });
  });
});
