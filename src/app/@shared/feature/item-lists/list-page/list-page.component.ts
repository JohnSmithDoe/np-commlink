import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, pricetagsOutline, remove } from 'ionicons/icons';
import { categoryName } from '../../../util/categories/category.utils';
import { LIST_FACADE } from '../../../util/item-lists/list-page.facade';
import { ItemListEmptyComponent } from '../../../ui/base-item/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../../ui/base-item/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../../ui/base-item/item-list-toolbar/item-list-toolbar.component';
import {
  ItemListComponent,
  ItemListTemplateContext,
} from '../../../ui/base-item/item-list/item-list.component';
import { PageHeaderComponent } from '../../../ui/page-header/page-header.component';

/**
 * Domain-blind list page shell: page-header + searchbar + toolbar, item-list,
 * empty state and category dialog. It knows no list identity — the active list's
 * signals and dispatch live behind the injected {@link LIST_FACADE} a consumer
 * domain provides. The quick-add row is a grocery-only concern the shell stays
 * blind to: grocery pages project their quick-add component into the `[quickAdd]`
 * slot (and their cross-list search buckets into `[searchExtras]`); tracking and
 * tasks project neither.
 */
@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonContent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
})
export class ListPageComponent {
  readonly facade = inject(LIST_FACADE);

  itemTemplate = input.required<TemplateRef<ItemListTemplateContext>>();
  // Optional ionicon name shown before the page title (the deck brand look).
  // Tracking sets `timer-outline`; grocery/tasks omit it.
  icon = input<string>();
  listHeader = input.required<string>();
  pageHeader = input.required<string>();

  // Whether to offer the entry button to the catalog page — which is exactly
  // whether the facade can navigate there. An input for this was a second
  // switch on one fact: a caller could claim categories while its facade omitted
  // `manageCategories`, rendering a button that does nothing, and compile.
  readonly hasCategories = !!this.facade.manageCategories;

  readonly hasFilter = computed(() => !!this.facade.state()?.filterBy);

  // The active category filter resolved to a display name (filterBy is a
  // category id now). Empty when no filter is set.
  readonly filterName = computed(() => {
    const state = this.facade.state();
    return categoryName(state?.filterBy, this.facade.catalog());
  });

  constructor() {
    addIcons({ add, remove, pricetagsOutline });
  }

  // Optional on the facade contract, which template syntax cannot narrow —
  // `hasCategories` above is the same test.
  manageCategories() {
    this.facade.manageCategories?.();
  }
}
