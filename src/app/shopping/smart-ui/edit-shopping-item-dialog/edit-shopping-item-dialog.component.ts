import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { CategoryInputComponent } from '../../../@shared/smart-ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/smart-ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditShoppingItem } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import { selectShoppingState } from '../../data/shopping.selector';

@Component({
  selector: 'app-edit-shopping-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-shopping-item-dialog.component.html',
  styleUrl: './edit-shopping-item-dialog.component.scss',
})
export class EditShoppingItemDialogComponent {
  readonly #store = inject(Store);

  rxItem = this.#store.selectSignal(selectEditShoppingItem);
  rxState = this.#store.selectSignal(selectShoppingState);

  constructor() {
    addIcons({ closeCircle });
  }

  updateQuantity(value: number) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        quantity: value,
      })
    );
  }
}
