import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { GroceryListPageFacade } from '../../data';
import { TextItemComponent } from '../../../@shared/ui/base-item/text-item/text-item.component';

@Component({
  selector: 'app-item-list-quick-add',
  templateUrl: 'item-list-quick-add.component.html',
  styleUrls: ['item-list-quick-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextItemComponent, TranslatePipe],
})
export class ItemListQuickAddComponent {
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
