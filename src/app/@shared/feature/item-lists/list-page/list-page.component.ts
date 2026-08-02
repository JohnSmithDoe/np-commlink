import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, closeOutline, pricetagsOutline, remove } from 'ionicons/icons';
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

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonButtons,
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
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  itemTemplate = input.required<TemplateRef<ItemListTemplateContext>>();
  icon = input<string>();
  listHeader = input.required<string>();
  pageHeader = input.required<string>();

  readonly hasCategories = !!this.facade.manageCategories;

  readonly hasFilter = computed(() => !!this.facade.state()?.filterBy);

  readonly filterName = computed(() => {
    const state = this.facade.state();
    return categoryName(state?.filterBy, this.facade.catalog());
  });

  constructor() {
    addIcons({ add, remove, pricetagsOutline, closeOutline });
  }

  manageCategories() {
    this.facade.manageCategories?.();
  }

  clearFilter(): void {
    this.facade.selectCategory();
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: {},
      replaceUrl: true,
    });
  }
}
