import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonReorder,
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { TColor, TIonDragEvent } from '../../../model/app.types';
import { IBaseItem } from '../../../model/base-item.types';
import { ICategory } from '../../../model/category.types';
import { revealedSideFromDrag } from '../../../util/app.utils';
import { categoryNames } from '../../../util/categories/category.utils';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonReorder,
    IonNote,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonText,
    TranslatePipe,
  ],
})
export class ListItemComponent {
  readonly item = input.required<IBaseItem>();
  readonly title = input.required<string>();
  readonly ionList = input.required<IonList>();
  // The list's {id,name} catalog, so the category note resolves ids → names.
  readonly categories = input<readonly ICategory[]>([]);

  readonly statusColor = input<TColor>();
  readonly crossedOut = input(false, { transform: booleanAttribute });
  readonly showQuantityActions = input(false, {
    transform: booleanAttribute,
  });
  /**
   * The i18n key naming the start-swipe action, and the switch that shows it.
   *
   * One input rather than a flag plus a label because the label cannot be
   * defaulted here: the same swipe means "mark as bought" on the shopping list and
   * "add to the shopping list" in storage, so the wording belongs to the domain
   * mounting this row (docs/ionic-a11y-practices.md R2 — an icon-only
   * `ion-item-option` renders a bare button with no name of its own). Tying the
   * affordance to its name makes a nameless one impossible instead of silent.
   */
  readonly cartActionLabel = input('');

  readonly showCartAction = computed(() => !!this.cartActionLabel());
  readonly hasStatusBar = computed(() => !!this.statusColor());
  readonly categoryNote = computed(() =>
    categoryNames(this.item(), this.categories()).join(', ')
  );

  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly selectItem = output<void>();
  readonly deleteItem = output<void>();
  readonly cartItem = output<void>();

  incrementQuantity(event: MouseEvent) {
    this.increment.emit();
    event.stopPropagation();
  }

  decrementQuantity(event: MouseEvent) {
    this.decrement.emit();
    event.stopPropagation();
  }

  async deleteOrCartOnSwipe(event: TIonDragEvent) {
    switch (revealedSideFromDrag(event)) {
      case 'end': {
        return this.emitDeleteItem();
      }
      case 'start': {
        if (this.showCartAction()) {
          return this.emitCartItem();
        }
        return;
      }
      default: {
        return;
      }
    }
  }

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteItem.emit();
  }

  async emitCartItem() {
    await this.ionList().closeSlidingItems();
    this.cartItem.emit();
  }
}
