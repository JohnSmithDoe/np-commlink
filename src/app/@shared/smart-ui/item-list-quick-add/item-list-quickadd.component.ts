import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddGlobal,
  selectQuickAddCanAddLocal,
  selectQuickAddState,
} from '../../data/quick-add/quick-add.selector';
import { TextItemComponent } from '../../ui/item-list-items/text-item/text-item.component';

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
  rxShowGlobal = this.#store.selectSignal(selectQuickAddCanAddGlobal);
  rxShowCategoy = this.#store.selectSignal(selectQuickAddCanAddCategory);

  @Output() quickAddItem = new EventEmitter<void>();
  @Output() quickCreateGlobal = new EventEmitter<void>();
  @Output() quickCreateCategory = new EventEmitter<void>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }
}
