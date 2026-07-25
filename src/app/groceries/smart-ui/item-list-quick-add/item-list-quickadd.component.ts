import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { GroceryListPageFacade } from '../../data';
import { TextItemComponent } from '../../../@shared/ui/base-item/item-list/item-list-items/text-item/text-item.component';

@Component({
  selector: 'app-item-list-quickadd',
  templateUrl: 'item-list-quickadd.component.html',
  styleUrls: ['item-list-quickadd.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextItemComponent, TranslateModule],
})
export class ItemListQuickaddComponent {
  readonly #facade = inject(GroceryListPageFacade);
  rxState = this.#facade.quickAddState;
  rxShowLocal = this.#facade.quickAddCanAddLocal;
  rxShowProduct = this.#facade.quickAddCanAddProduct;
  rxShowCategoy = this.#facade.quickAddCanAddCategory;

  quickAddItem = output<void>();
  quickCreateProduct = output<void>();
  quickCreateCategory = output<void>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }
}
