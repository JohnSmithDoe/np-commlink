import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { TrackingListPageFacade } from '../../data';
import { ITrackingItem, ITrackingItemNotificationsConfig } from '../../model';

const DEFAULT_NOTIFICATIONS: ITrackingItemNotificationsConfig = {
  onStart: false,
  onStop: false,
  onProcess: false,
};

marker('edit.item.dialog.notifications.onStart');
marker('edit.item.dialog.notifications.onStop');
marker('edit.item.dialog.notifications.onProcess');
// Passed as a plain `closeButtonText` attribute (translated inside the modal),
// so the extractor can't see it here.
marker('edit.item.dialog.button.close');

/**
 * Tracking edit-dialog wrapper (type:feature). Extends the plain
 * `BaseEditItemDialog` (tracking has no categories) and adds the notification
 * toggles. Guards on `listId === '_tracking'` and saves via
 * `TrackingActions.addOrUpdateItem`.
 */
@Component({
  selector: 'app-edit-tracking-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ItemEditModalComponent,
    IonItem,
    IonLabel,
    IonToggle,
  ],
  templateUrl: './edit-tracking-item-dialog.component.html',
  styleUrl: './edit-tracking-item-dialog.component.scss',
})
export class EditTrackingItemDialogComponent extends BaseEditItemDialog<ITrackingItem> {
  readonly #facade = inject(TrackingListPageFacade);
  protected readonly listId = '_tracking' as const;
  readonly listItems = this.#facade.items;

  protected save(item: ITrackingItem): void {
    this.#facade.saveItem(item);
  }

  updateNotifications(
    key: keyof ITrackingItemNotificationsConfig,
    checked: boolean
  ) {
    const current = this.draft()?.notifications ?? DEFAULT_NOTIFICATIONS;
    this.patch({ notifications: { ...current, [key]: checked } });
  }
}
