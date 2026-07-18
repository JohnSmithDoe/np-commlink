import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  output,
  input,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { TItemListMode, TItemListSortType } from '../../../types';

@Component({
  selector: 'app-item-list-toolbar',
  templateUrl: 'item-list-toolbar.component.html',
  styleUrls: ['item-list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonButtons, IonButton, IonIcon, TranslateModule],
})
export class ItemListToolbarComponent {
  readonly showReorder = input(false, { transform: booleanAttribute });
  // The list/categories display-mode toggle is a category-list affordance;
  // category-less lists (tracking) suppress it via [showDisplayMode]="false".
  readonly showDisplayMode = input(true, { transform: booleanAttribute });

  readonly selectSortMode = output<TItemListSortType>();
  readonly toggleReorder = output<void>();
  // Grocery lists toggle between a flat list and a category overview.
  readonly selectDisplayMode = output<TItemListMode>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }
}
