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
import { IBaseItem } from '../../../@shared/types';
import { DialogsActions } from '../../data/dialogs/dialogs.actions';
import {
  selectEditItem,
  selectEditState,
} from '../../data/dialogs/dialogs.selector';
import { ItemNameInputComponent } from '../../../@shared/ui/forms/item-name-input/item-name-input.component';

@Component({
  selector: 'app-item-edit-modal',
  templateUrl: './item-edit-modal.component.html',
  styleUrls: ['./item-edit-modal.component.scss'],
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditModalComponent {
  readonly #store = inject(Store);

  readonly rxState = this.#store.selectSignal(selectEditState);
  readonly rxItem = this.#store.selectSignal(selectEditItem);

  readonly listItems = input<IBaseItem[] | null>();

  constructor() {}

  cancelChanges() {
    this.#store.dispatch(DialogsActions.abortChanges());
  }

  closedDialog() {
    this.#store.dispatch(DialogsActions.hideDialog());
  }

  submitChanges() {
    this.#store.dispatch(DialogsActions.confirmChanges());
  }

  updateName(value: string) {
    this.#store.dispatch(
      DialogsActions.updateItem({
        name: value,
      })
    );
  }
}
