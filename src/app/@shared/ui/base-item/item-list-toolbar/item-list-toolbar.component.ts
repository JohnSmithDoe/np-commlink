import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton, IonButtons, IonToolbar } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TItemListMode,
  TItemListSortType,
} from '../../../model/item-list.types';

@Component({
  selector: 'app-item-list-toolbar',
  templateUrl: 'item-list-toolbar.component.html',
  styleUrls: ['item-list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonButtons, IonButton, TranslatePipe],
})
export class ItemListToolbarComponent {
  // The list/categories display-mode toggle is a category-list affordance;
  // category-less lists (tracking) suppress it via [showDisplayMode]="false".
  readonly showDisplayMode = input(true, { transform: booleanAttribute });

  readonly selectSortMode = output<TItemListSortType>();
  // Grocery lists toggle between a flat list and a category overview.
  readonly selectDisplayMode = output<TItemListMode>();
}
