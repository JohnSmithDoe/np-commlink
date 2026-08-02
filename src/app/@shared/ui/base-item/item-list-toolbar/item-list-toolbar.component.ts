import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IonButton, IonButtons, IonToolbar } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { ItemListSortType } from '../../../model/item-list.types';

@Component({
  selector: 'app-item-list-toolbar',
  templateUrl: 'item-list-toolbar.component.html',
  styleUrls: ['item-list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonButtons, IonButton, TranslatePipe],
})
export class ItemListToolbarComponent {
  readonly selectSortMode = output<ItemListSortType>();
}
