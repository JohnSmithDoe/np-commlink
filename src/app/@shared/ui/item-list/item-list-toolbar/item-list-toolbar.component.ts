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
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { TItemListSortType } from '../../../types';

@Component({
  selector: 'app-item-list-toolbar',
  templateUrl: 'item-list-toolbar.component.html',
  styleUrls: ['item-list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonButtons, IonButton, IonIcon],
})
export class ItemListToolbarComponent {
  readonly showReorder = input(false, { transform: booleanAttribute });

  readonly selectSortMode = output<TItemListSortType>();
  readonly toggleReorder = output<void>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }
}
