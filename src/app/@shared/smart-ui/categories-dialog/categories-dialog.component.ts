import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxCustomEvent } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TItemListCategory } from '../../types';

import { CategoriesActions } from '../../data/item-dialogs/item-dialogs.actions';
import {
  selectCategories,
  selectCategoriesState,
  selectContainsSearchResult,
  selectSelectedCategories,
} from '../../data/item-dialogs/item-dialogs.selector';

@Component({
  selector: 'app-categories-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-dialog.component.html',
  styleUrls: ['./categories-dialog.component.scss'],
  imports: [
    FormsModule,
    TranslateModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonNote,
  ],
})
export class CategoriesDialogComponent {
  readonly #store = inject(Store);

  rxSearchContained = this.#store.selectSignal(selectContainsSearchResult);
  rxState = this.#store.selectSignal(selectCategoriesState);
  rxItems = this.#store.selectSignal(selectCategories);
  rxSelection = this.#store.selectSignal(selectSelectedCategories);

  constructor() {}

  searchbarInput(ev: any) {
    this.#store.dispatch(CategoriesActions.updateSearchQuery(ev.target.value));
  }

  isChecked(item: TItemListCategory) {
    return this.rxSelection().includes(item);
  }

  selectionChange(ev: CheckboxCustomEvent<TItemListCategory>) {
    this.#store.dispatch(CategoriesActions.toggleCategory(ev.detail.value));
  }

  addNewCategory() {
    this.#store.dispatch(CategoriesActions.addCategoryFromDialogSearch());
  }

  cancelChanges() {
    this.#store.dispatch(CategoriesActions.abortChanges());
  }

  closedDialog() {
    this.#store.dispatch(CategoriesActions.abortChanges());
  }

  confirmChanges() {
    this.#store.dispatch(CategoriesActions.confirmChanges());
  }
}
