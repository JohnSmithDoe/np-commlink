/* ─── why ─────────────────────────────────────────────────────────
 * All five of the dumb component's bindings resolve to the same facade on
 * every page that mounts it, so the three list pages each carried a
 * byte-identical binding block. This holds the wiring once; the
 * presentational half stays dumb and spec'd on its own inputs.
 *
 * The host is `display: flex` because a custom element is inline by
 * default, and global.scss's `ion-content > *` cap cannot act on an inline
 * non-replaced box — without it this is the one block on the page that
 * ignores the reading column everything else shares.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HouseholdCopyService, HouseholdListPageFacade } from '../../data';
import { HouseholdSearchResultComponent } from '../../ui/household-search-result/household-search-result.component';

@Component({
  selector: 'app-household-search-panel',
  template: `
    <app-household-search-result
      [results]="facade.searchResult()"
      [catalog]="facade.catalog()"
      (selectProduct)="copy.addProduct($event)"
      (selectStorageItem)="copy.addStorageItem($event)"
      (selectShoppingItem)="copy.addShoppingItem($event)"
    ></app-household-search-result>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HouseholdSearchResultComponent],
})
export class HouseholdSearchPanelComponent {
  readonly facade = inject(HouseholdListPageFacade);
  readonly copy = inject(HouseholdCopyService);
}
