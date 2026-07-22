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
import { TranslateModule } from '@ngx-translate/core';
import { IBaseItem, ICategory, TColor, TIonDragEvent } from '../../../types';
import { checkItemOptionsOnDrag } from '../../../util/app.utils';
import { CategoryNoteDirective } from '../../category-note.directive';

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
    TranslateModule,
    CategoryNoteDirective,
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
  readonly showCartAction = input(false, { transform: booleanAttribute });

  readonly hasStatusBar = computed(() => !!this.statusColor());

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

  async handleItemOptionsOnDrag(event: TIonDragEvent) {
    switch (checkItemOptionsOnDrag(event)) {
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
