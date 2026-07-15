import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonList,
  IonModal,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IBaseItem, TItemListId } from '../../types';
import { ItemDialogsActions } from '../../data/item-dialogs/item-dialogs.actions';
import {
  selectEditItem,
  selectEditState,
} from '../../data/item-dialogs/item-dialogs.selector';
import { ItemNameInputComponent } from '../../ui/forms/item-name-input/item-name-input.component';

@Component({
  selector: 'app-item-edit-modal',
  templateUrl: './item-edit-modal.component.html',
  styleUrls: ['./item-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    ItemNameInputComponent,
    TranslateModule,
  ],
})
export class ItemEditModalComponent {
  readonly #store = inject(Store);

  readonly rxState = this.#store.selectSignal(selectEditState);
  readonly rxItem = this.#store.selectSignal(selectEditItem);

  listId = input.required<TItemListId>();
  listItems = input<IBaseItem[] | null>();

  cancelChanges() {
    this.#store.dispatch(ItemDialogsActions.abortChanges());
  }

  closedDialog() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  submitChanges() {
    this.#store.dispatch(ItemDialogsActions.confirmChanges());
  }

  updateName(value: string) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        name: value,
      })
    );
  }
}
