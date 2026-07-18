import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonToolbar,
  InputCustomEvent,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { CategoriesActions } from '../../data/item-dialogs/item-dialogs.actions';
import {
  selectCategoriesState,
  selectEditState,
} from '../../data/item-dialogs/item-dialogs.selector';

@Component({
  selector: 'app-edit-category-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    TranslateModule,
  ],
  templateUrl: './edit-category-dialog.component.html',
  styleUrl: './edit-category-dialog.component.scss',
})
export class EditCategoryDialogComponent {
  readonly #store = inject(Store);
  rxState = this.#store.selectSignal(selectEditState);
  rxCategoryState = this.#store.selectSignal(selectCategoriesState);

  constructor() {
    addIcons({ closeCircle });
  }

  updateCategory(ev: InputCustomEvent) {
    this.#store.dispatch(
      CategoriesActions.updateCategory(ev.detail.value ?? '')
    );
  }

  submitChanges() {
    this.#store.dispatch(CategoriesActions.confirmEditChanges());
  }

  cancelChanges() {
    this.#store.dispatch(CategoriesActions.abortEditChanges());
  }

  closedDialog() {
    this.cancelChanges();
  }
}
