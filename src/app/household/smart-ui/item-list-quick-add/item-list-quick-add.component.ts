/* ─── why ─────────────────────────────────────────────────────────
 * This dispatches rather than emitting, which is unusual for a
 * presentational component and is the point: all three list pages wired
 * the same two outputs to the same two methods of the same facade, so the
 * outputs were a seam with one possible wiring copied three times. It is
 * already smart — it reads `QuickAddFacade` — and both facades belong to
 * this domain, so there was never a second consumer to keep the seam for.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HouseholdListPageFacade, QuickAddFacade } from '../../data';
import { TextItemComponent } from '../../../@shared/ui/base-item/text-item/text-item.component';

@Component({
  selector: 'app-item-list-quick-add',
  templateUrl: 'item-list-quick-add.component.html',
  styleUrls: ['item-list-quick-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextItemComponent, TranslatePipe],
})
export class ItemListQuickAddComponent {
  readonly #quickAdd = inject(QuickAddFacade);
  readonly #list = inject(HouseholdListPageFacade);

  readonly state = this.#quickAdd.state;
  readonly canAddLocal = this.#quickAdd.canAddLocal;
  readonly canAddProduct = this.#quickAdd.canAddProduct;

  addItem(): void {
    this.#list.addItemFromSearch();
  }

  createProduct(): void {
    this.#list.showCreateProductDialog();
  }
}
