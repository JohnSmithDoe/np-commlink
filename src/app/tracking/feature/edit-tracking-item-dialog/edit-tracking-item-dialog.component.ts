import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
  selectEditTrackingItem,
  selectTrackingListItems,
  TrackingActions,
} from '../../data';
import { ITrackingItem, ITrackingItemNotificationsConfig } from '../../model';

const DEFAULT_NOTIFICATIONS: ITrackingItemNotificationsConfig = {
  onStart: false,
  onStop: false,
  onProcess: false,
};

marker('edit.item.dialog.notifications.onStart');
marker('edit.item.dialog.notifications.onStop');
marker('edit.item.dialog.notifications.onProcess');

/**
 * Tracking edit-dialog wrapper (type:feature). Composes the shared pure-`ui`
 * `@shared/ui/item-edit-modal` and reads the shared, domain-blind `itemDialogs`
 * open-command (the established grocery/tasks flow — tracking's own `dialogs`
 * fork is gone). Owns the edit draft locally (notification toggles + name),
 * guards on `listId === '_tracking'`, and saves via
 * `TrackingActions.addOrUpdateItem` on confirm. Tracking has no categories.
 */
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

  readonly #open = this.#store.selectSignal(selectEditState);
  readonly seedItem = this.#store.selectSignal(selectEditTrackingItem);
  readonly listItems = this.#store.selectSignal(selectTrackingListItems);

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === '_tracking'
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  readonly draft = linkedSignal<ITrackingItem | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<ITrackingItem>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  updateNotifications(
    key: keyof ITrackingItemNotificationsConfig,
    checked: boolean
  ) {
    const current = this.draft()?.notifications ?? DEFAULT_NOTIFICATIONS;
    this.#patch({ notifications: { ...current, [key]: checked } });
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.#store.dispatch(TrackingActions.addOrUpdateItem(draft));
    }
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }
}
