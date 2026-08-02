/* ─── why ─────────────────────────────────────────────────────────
 * This component registers the two icons its own template names
 * (`add`/`remove`) and deliberately not the third. `startSwipeAction.icon`
 * arrives bound, so the name is a string written by the host page — which
 * is the half `verify:icons` holds the host to, not this file.
 * ───────────────────────────────────────────────────────────────── */
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
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import { IonColor, IonDragEvent } from '../../../model/app.types';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';
import { revealedSideFromDrag } from '../../../util/app.utils';
import { categoryNames } from '../../../util/categories/category.utils';

export type StartSwipeAction = { labelKey: string; icon: string };

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
  readonly item = input.required<BaseItem>();
  readonly title = input.required<string>();
  readonly ionList = input.required<IonList>();
  readonly categories = input<readonly Category[]>([]);

  readonly statusColor = input<IonColor>();
  readonly crossedOut = input(false, { transform: booleanAttribute });
  readonly showQuantityActions = input(false, {
    transform: booleanAttribute,
  });
  readonly startSwipeAction = input<StartSwipeAction>();

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

  constructor() {
    addIcons({ add, remove });
  }

  incrementQuantity(event: MouseEvent) {
    this.increment.emit();
    event.stopPropagation();
  }

  decrementQuantity(event: MouseEvent) {
    this.decrement.emit();
    event.stopPropagation();
  }

  async deleteOrCartOnSwipe(event: IonDragEvent) {
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
