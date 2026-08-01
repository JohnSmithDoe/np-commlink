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

export type TStartSwipeAction = { labelKey: string; icon: string };

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
   * The start-swipe affordance: its i18n key, its icon, and — by being present
   * at all — the switch that shows it.
   *
   * Neither half can be defaulted here. The same swipe means "mark as bought" on
   * the shopping list, "add to the shopping list" in storage and "rename" on a
   * catalog, so both the wording and the icon belong to the domain mounting this
   * row (docs/ionic-a11y-practices.md R2 — an icon-only `ion-item-option`
   * renders a bare button with no name of its own). One object rather than two
   * inputs because a caller that set the label and forgot the icon used to get a
   * shopping cart on its rename gesture; now the affordance either exists whole
   * or not at all.
   *
   * Named for the gesture, not for one caller's meaning of it: as `cartItem` it
   * put grocery vocabulary on a domain-blind component, and the catalog's rename
   * would have had to bind `(cartItem)` to read the row's third affordance.
   */
  readonly startSwipeAction = input<TStartSwipeAction>();

  readonly hasStartSwipe = computed(() => !!this.startSwipeAction());
  readonly hasStatusBar = computed(() => !!this.statusColor());
  readonly categoryNote = computed(() =>
    categoryNames(this.item(), this.categories()).join(', ')
  );

  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly selectItem = output<void>();
  readonly deleteItem = output<void>();
  readonly startSwipe = output<void>();

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
        if (this.hasStartSwipe()) {
          return this.emitStartSwipe();
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

  async emitStartSwipe() {
    await this.ionList().closeSlidingItems();
    this.startSwipe.emit();
  }
}
