import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddProduct,
  selectQuickAddCanAddLocal,
  selectQuickAddState,
} from '../../data';
import { TextItemComponent } from '../../../@shared/ui/item-list-items/text-item/text-item.component';

@Component({
  selector: 'app-item-list-quickadd',
  templateUrl: 'item-list-quickadd.component.html',
  styleUrls: ['item-list-quickadd.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextItemComponent, TranslateModule],
})
export class ItemListQuickaddComponent {
  readonly #store = inject(Store);
  rxState = this.#store.selectSignal(selectQuickAddState);
  rxShowLocal = this.#store.selectSignal(selectQuickAddCanAddLocal);
  rxShowProduct = this.#store.selectSignal(selectQuickAddCanAddProduct);
  rxShowCategoy = this.#store.selectSignal(selectQuickAddCanAddCategory);

  quickAddItem = output<void>();
  quickCreateProduct = output<void>();
  quickCreateCategory = output<void>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }
}
