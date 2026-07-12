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
import { IBaseItem, TColor, TIonDragEvent } from '../../../types';
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

  incrementQuantity(ev: MouseEvent) {
    this.increment.emit();
    ev.stopPropagation();
  }

  decrementQuantity(ev: MouseEvent) {
    this.decrement.emit();
    ev.stopPropagation();
  }

  async handleItemOptionsOnDrag(ev: TIonDragEvent) {
    switch (checkItemOptionsOnDrag(ev)) {
      case 'end':
        return this.emitDeleteItem();
      case 'start':
        if (this.showCartAction()) {
          return this.emitCartItem();
        }
        return undefined;
      default:
        return undefined;
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
