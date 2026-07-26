import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { TrackingListPageFacade } from '../../data';
import { ITrackingItem, TRACKING_LIST_ID } from '../../model/tracking.types';

// Passed as a plain `closeButtonText` attribute (translated inside the modal),
// so the extractor can't see it here.
marker('edit.item.dialog.button.close');

/**
 * Tracking edit-dialog wrapper (type:feature). Extends the plain
 * `BaseEditItemDialog` (tracking has no categories). Guards on
 * `listId === '_tracking'` and saves via `TrackingActions.addOrUpdateItem`.
 */
@Component({
  selector: 'app-edit-tracking-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, ItemEditModalComponent],
  templateUrl: './edit-tracking-item-dialog.component.html',
  styleUrl: './edit-tracking-item-dialog.component.scss',
})
export class EditTrackingItemDialogComponent extends BaseEditItemDialog<ITrackingItem> {
  readonly #facade = inject(TrackingListPageFacade);
  protected readonly listId = TRACKING_LIST_ID;
  readonly listItems = this.#facade.items;

  protected save(item: ITrackingItem): void {
    this.#facade.saveItem(item);
  }
}
