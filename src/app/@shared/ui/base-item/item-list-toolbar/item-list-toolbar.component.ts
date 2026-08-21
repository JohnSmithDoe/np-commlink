/* ─── why ─────────────────────────────────────────────────────────
 * The sort buttons live here rather than being projected, because only
 * this component knows the active sort and a button that cannot see it
 * cannot show it. Every tap toggles direction, so a projected button meant
 * a second tap silently reversed the list with nothing on screen changing.
 *
 * `name` is built in — most lists sort by it — and domains add their own
 * through `options`, which keeps `[toolbarActions]` meaning ACTIONS. It is
 * `sortable` that decides whether ANY of them render: a facade declaring no
 * `sortOptions` gets no sort buttons rather than the built-in one alone,
 * which is how a ledger keeps this toolbar for its actions while its order
 * stays pinned in the selector.
 *
 * The input is `activeSort`, not `sort`: `unicorn/no-array-sort` matches on
 * call shape, and `this.sort()` is indistinguishable from `Array#sort()`.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowDown, arrowUp } from 'ionicons/icons';
import {
  ItemListSort,
  ItemListSortOption,
  ItemListSortType,
} from '../../../model/item-list.types';

const SORT_BY_NAME: ItemListSortOption = {
  type: 'name',
  labelKey: marker('item-list.toolbar.sort-az'),
};

@Component({
  selector: 'app-item-list-toolbar',
  templateUrl: 'item-list-toolbar.component.html',
  styleUrls: ['item-list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonButtons, IonButton, IonIcon, TranslatePipe],
})
export class ItemListToolbarComponent {
  readonly activeSort = input<ItemListSort>();
  readonly options = input<readonly ItemListSortOption[]>([]);
  readonly sortable = input(true);

  readonly selectSortMode = output<ItemListSortType>();

  readonly sortByName = SORT_BY_NAME;

  constructor() {
    addIcons({ arrowUp, arrowDown });
  }

  isActive(type: ItemListSortType): boolean {
    return this.activeSort()?.sortBy === type;
  }

  directionIcon(type: ItemListSortType): string | undefined {
    if (!this.isActive(type)) return undefined;
    return this.activeSort()?.sortDirection === 'desc'
      ? 'arrow-down'
      : 'arrow-up';
  }
}
