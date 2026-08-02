/* ─── why ─────────────────────────────────────────────────────────
 * The dumb `app-household-search-result` takes two inputs and three
 * outputs, and all five resolve to the same `HouseholdListPageFacade` on
 * every page that mounts it — so the three list pages carried a
 * byte-identical eight-line binding block each. This holds the wiring
 * once; the presentational half stays dumb and spec'd on its own inputs.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HouseholdListPageFacade } from '../../data';
import { HouseholdSearchResultComponent } from '../../ui/household-search-result/household-search-result.component';

@Component({
  selector: 'app-household-search-panel',
  template: `
    <app-household-search-result
      [results]="facade.searchResult()"
      [catalog]="facade.catalog()"
      (selectProduct)="facade.addProduct($event)"
      (selectStorageItem)="facade.addStorageItem($event)"
      (selectShoppingItem)="facade.addShoppingItem($event)"
    ></app-household-search-result>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HouseholdSearchResultComponent],
})
export class HouseholdSearchPanelComponent {
  readonly facade = inject(HouseholdListPageFacade);
}
