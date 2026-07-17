import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { CategoriesDialogComponent } from '../../../@shared/smart-ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/smart-ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/smart-ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditStorageItem, selectStorageListItems } from '../../data';

@Component({
  selector: 'app-edit-storage-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    DateInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-storage-item-dialog.component.html',
  styleUrl: './edit-storage-item-dialog.component.scss',
})
export class EditStorageItemDialogComponent {
  readonly #store = inject(Store);

  rxItem = this.#store.selectSignal(selectEditStorageItem);
  rxStorageItems = this.#store.selectSignal(selectStorageListItems);

  constructor() {
    addIcons({ closeCircle });
  }

  updateBestBefore(value: string | undefined) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        bestBefore: value,
      })
    );
  }

  updateMinAmount(value: number) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        minAmount: value,
      })
    );
  }
}
