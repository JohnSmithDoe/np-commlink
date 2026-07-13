import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectCustomEvent } from '@ionic/angular';
import {
  IonItem,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TBestBeforeTimespan } from '../../../@shared/types';
import { CategoryInputComponent } from '../../../@shared/smart-ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/smart-ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditProduct } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import { selectProductListItems } from '../../data/products.selector';

@Component({
  selector: 'app-edit-product-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IonItem,
    TranslateModule,
    IonSelect,
    IonSelectOption,
    IonText,
    ReactiveFormsModule,
    CategoryInputComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-product-dialog.component.html',
  styleUrl: './edit-product-dialog.component.scss',
})
export class EditProductDialogComponent {
  readonly #store = inject(Store);

  rxItem = this.#store.selectSignal(selectEditProduct);
  rxProducts = this.#store.selectSignal(selectProductListItems);

  constructor() {
    addIcons({ closeCircle });
  }

  setBestBeforeTimespan(ev: SelectCustomEvent<TBestBeforeTimespan>) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        bestBeforeTimespan: ev.detail.value,
        bestBeforeTimevalue: ev.detail.value === 'forever' ? undefined : 1,
      })
    );
  }

  setBestBeforeTimevalue(value: number) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        bestBeforeTimevalue: value,
      })
    );
  }
}
