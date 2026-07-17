import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { IonChip, IonIcon, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TItemListCategory } from '../../types';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../data/item-dialogs/item-dialogs.actions';

@Component({
  selector: 'app-category-input',
  templateUrl: './category-input.component.html',
  styleUrls: ['./category-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonChip, IonIcon, TranslateModule],
})
export class CategoryInputComponent {
  readonly #store = inject(Store);
  categories = input<TItemListCategory[]>();

  constructor() {
    addIcons({ closeCircle });
  }

  removeCategory(cat: TItemListCategory) {
    this.#store.dispatch(ItemDialogsActions.removeCategory(cat));
  }

  showCategoryDialog() {
    this.#store.dispatch(CategoriesActions.showDialog());
  }
}
