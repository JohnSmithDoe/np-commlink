import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ItemEditModalComponent } from '../item-edit-modal/item-edit-modal.component';
import { dialogsActions } from '../../data/dialogs/dialogs.actions';
import { selectEditItemTracking } from '../../data/dialogs/dialogs.selector';
import { selectListItemsTracking } from '../../data/tracking.selector';
import {
  ITrackingItem,
  ITrackingItemNotificationsConfig,
} from '../../../@shared/types';

const DEFAULT_NOTIFICATIONS: ITrackingItemNotificationsConfig = {
  onStart: false,
  onStop: false,
  onProcess: false,
};

marker('edit.item.dialog.notifications.onStart');
marker('edit.item.dialog.notifications.onStop');
marker('edit.item.dialog.notifications.onProcess');

@Component({
  selector: 'app-edit-tracking-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    ItemEditModalComponent,
    IonItem,
    IonLabel,
    IonToggle,
  ],
  templateUrl: './edit-tracking-item-dialog.component.html',
  styleUrl: './edit-tracking-item-dialog.component.scss',
})
export class EditTrackingItemDialogComponent {
  readonly #store = inject(Store);

  readonly rxItem = this.#store.selectSignal(selectEditItemTracking);
  readonly rxItems = this.#store.selectSignal(selectListItemsTracking);

  constructor() {
    addIcons({ closeCircle });
  }

  updateNotifications(
    item: ITrackingItem | null | undefined,
    key: keyof ITrackingItemNotificationsConfig,
    checked: boolean
  ) {
    const current = item?.notifications ?? DEFAULT_NOTIFICATIONS;
    this.#store.dispatch(
      dialogsActions.updateItem({
        notifications: { ...current, [key]: checked },
      })
    );
  }
}
