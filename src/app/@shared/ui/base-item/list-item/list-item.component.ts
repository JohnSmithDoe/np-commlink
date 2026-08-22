/* ─── why ─────────────────────────────────────────────────────────
 * This component registers the two icons its own template names
 * (`add`/`remove`) and deliberately not the others. `startSwipeAction.icon`
 * and `leadingIcon` arrive bound, so each name is a string written by the
 * host page — which is the half `verify:icons` holds the host to, not this
 * file.
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
  IonReorder,
  IonNote,
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import { IonColor } from '../../../model/app.types';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';
import { categoryNames } from '../../../util/categories/category.utils';
import { BaseSwipeRow } from '../base-swipe-row';

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
    IonNote,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonReorder,
    IonText,
    TranslatePipe,
  ],
})
export class ListItemComponent extends BaseSwipeRow {
  readonly item = input.required<BaseItem>();
  readonly title = input.required<string>();
  readonly categories = input<readonly Category[]>([]);

  readonly statusColor = input<IonColor>();
  readonly leadingIcon = input<string>();
  readonly crossedOut = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly showQuantityActions = input(false, {
    transform: booleanAttribute,
  });
  readonly reorderable = input(false, { transform: booleanAttribute });

  readonly hasStatusBar = computed(() => !!this.statusColor());
  readonly categoryNote = computed(() =>
    categoryNames(this.item(), this.categories()).join(', ')
  );

  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly selectItem = output<void>();

  constructor() {
    super();
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
}
