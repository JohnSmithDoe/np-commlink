import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { TrackingListPageFacade } from '../../data';
import { TRACKING_LIST_ID, TrackingItem } from '../../model/tracking.types';
import { createTrackingItem } from '../../util/tracking.factory';

@Component({
  selector: 'app-edit-tracking-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemEditModalComponent],
  templateUrl: './edit-tracking-item-dialog.component.html',
})
export class EditTrackingItemDialogComponent extends BaseEditItemDialog<TrackingItem> {
  protected blank(): TrackingItem {
    return createTrackingItem('');
  }

  readonly #facade = inject(TrackingListPageFacade);
  protected readonly listId = TRACKING_LIST_ID;
  readonly siblings = this.#facade.allItems;

  protected save(item: TrackingItem): void {
    this.#facade.saveItem(item);
  }
}
