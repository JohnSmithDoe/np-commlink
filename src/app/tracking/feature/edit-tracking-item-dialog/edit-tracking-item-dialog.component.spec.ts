import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/util/item-dialog.service';
import { createTrackingItem } from '../../util/tracking.factory';
import { selectTrackingListItems, TrackingActions } from '../../data';
import { EditTrackingItemDialogComponent } from './edit-tracking-item-dialog.component';

describe('EditTrackingItemDialogComponent', () => {
  let store: MockStore;
  let component: EditTrackingItemDialogComponent;
  let host: ItemDialogService;

  const seed = createTrackingItem('Task');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditTrackingItemDialogComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectTrackingListItems, []);
    store.refreshState();
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_tracking', editMode: 'update' });
    component = TestBed.createComponent(
      EditTrackingItemDialogComponent
    ).componentInstance;
  });

  it('saves the draft and hides the dialog on confirm', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateName('Renamed');
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.addOrUpdateItem({ ...seed, name: 'Renamed' })
    );
    expect(host.request()).toBeNull();
  });
});
